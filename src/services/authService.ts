import {
  auth,
  firestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  googleProvider,
  type User,
} from './firebase';

export interface RegisteredAccount {
  uid?: string;
  fullName: string;
  displayName?: string;
  username: string;
  email: string;
  password?: string;
  isGoogleLinked?: boolean;
  avatarUrl?: string;
  createdAt?: number;
  updatedAt?: number;
  isPwaDismissed?: boolean;
  authProviders?: string[];
  hasPassword?: boolean;
}

class AuthService {
  /**
   * Cari akun profil pengguna di Firestore berdasarkan email, username, atau uid.
   * Melakukan lookup cerdas pada koleksi 'usernames' dan 'users'.
   */
  public async findAccount(identifier: string): Promise<RegisteredAccount | null> {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    if (!cleanId) return null;

    try {
      // 1. Jika identifier bukan email (tanpa '@'), cek index pemetaan 'usernames/{username}'
      if (!cleanId.includes('@')) {
        const usernameDocRef = doc(firestore, 'usernames', cleanId);
        const usernameSnap = await getDoc(usernameDocRef);
        if (usernameSnap.exists()) {
          const uData = usernameSnap.data();
          if (uData?.email) {
            const userEmailSnap = await getDoc(doc(firestore, 'users', uData.email.toLowerCase()));
            if (userEmailSnap.exists()) {
              return userEmailSnap.data() as RegisteredAccount;
            }
          }
          if (uData?.uid) {
            const userUidSnap = await getDoc(doc(firestore, 'users', uData.uid));
            if (userUidSnap.exists()) {
              return userUidSnap.data() as RegisteredAccount;
            }
          }
        }
      }

      // 2. Coba ambil dokumen 'users/{cleanId}' langsung (bisa email atau uid)
      const docRef = doc(firestore, 'users', cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as RegisteredAccount;
      }

      // 3. Query koleksi 'users' berdasarkan field 'username' (case-insensitive / lowercase)
      const usersCol = collection(firestore, 'users');
      const qUsername = query(usersCol, where('username', '==', cleanId));
      const queryUserSnap = await getDocs(qUsername);
      if (!queryUserSnap.empty) {
        return queryUserSnap.docs[0].data() as RegisteredAccount;
      }

      // 4. Query koleksi 'users' berdasarkan field 'email'
      const qEmail = query(usersCol, where('email', '==', cleanId));
      const queryEmailSnap = await getDocs(qEmail);
      if (!queryEmailSnap.empty) {
        return queryEmailSnap.docs[0].data() as RegisteredAccount;
      }

      // 5. Query koleksi 'users' berdasarkan field 'uid'
      const qUid = query(usersCol, where('uid', '==', cleanId));
      const queryUidSnap = await getDocs(qUid);
      if (!queryUidSnap.empty) {
        return queryUidSnap.docs[0].data() as RegisteredAccount;
      }
    } catch (e) {
      console.warn('Firestore findAccount warning:', e);
    }

    return null;
  }

  /**
   * Sinkronkan data profil pengguna saat Sign In / Sign Up via Google OAuth
   * Menyimpan/menggabungkan profil di Firestore:
   * 1. users/{email} (kompatibilitas penuh seluruh aplikasi)
   * 2. users/{uid} (pencarian berdasarkan UID Firebase)
   * 3. usernames/{username} (indeks pemetaan cepat username -> email/uid)
   */
  public async syncGoogleUser(googleUser: User): Promise<RegisteredAccount> {
    const cleanEmail = (googleUser.email || '').trim().toLowerCase();
    const uid = googleUser.uid;
    const fullName = googleUser.displayName || cleanEmail.split('@')[0] || 'Pengguna Google';
    const avatarUrl = googleUser.photoURL || '';

    // Cek apakah akun sudah pernah ada di database
    const existing = (cleanEmail ? await this.findAccount(cleanEmail) : null) || (uid ? await this.findAccount(uid) : null);

    // Tentukan username: pertahankan yang sudah ada, atau buat dari prefix email
    let username = existing?.username;
    if (!username) {
      const emailPrefix = (cleanEmail.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      username = emailPrefix || `user_${uid.slice(0, 6)}`;
    }
    username = username.toLowerCase().replace(/^@/, '');

    const accountData: RegisteredAccount = {
      uid,
      email: cleanEmail,
      fullName: existing?.fullName || fullName,
      displayName: existing?.displayName || fullName,
      username,
      avatarUrl: avatarUrl || existing?.avatarUrl || '',
      isGoogleLinked: true,
      hasPassword: Boolean(existing?.hasPassword || existing?.password),
      authProviders: Array.from(new Set([...(existing?.authProviders || []), 'google.com'])),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isPwaDismissed: existing?.isPwaDismissed ?? false,
    };

    // 1. Simpan/Merge di 'users/{email}'
    if (cleanEmail) {
      try {
        await setDoc(doc(firestore, 'users', cleanEmail), accountData, { merge: true });
      } catch (e) {
        console.warn('Firestore syncGoogleUser users/{email} error:', e);
      }
    }

    // 2. Simpan/Merge di 'users/{uid}'
    if (uid) {
      try {
        await setDoc(doc(firestore, 'users', uid), accountData, { merge: true });
      } catch (e) {
        console.warn('Firestore syncGoogleUser users/{uid} error:', e);
      }
    }

    // 3. Simpan pemetaan di 'usernames/{username}'
    if (username) {
      try {
        await setDoc(
          doc(firestore, 'usernames', username),
          {
            uid,
            email: cleanEmail,
            username,
            fullName: accountData.fullName,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore syncGoogleUser usernames/{username} error:', e);
      }
    }

    return accountData;
  }

  /**
   * Simpan atau perbarui dokumen pengguna di Firestore (users/{email}, users/{uid}, dan usernames/{username})
   */
  public async saveAccountToFirestore(account: RegisteredAccount): Promise<void> {
    const cleanEmail = account.email?.trim().toLowerCase();
    const cleanUsername = account.username?.trim().toLowerCase().replace(/^@/, '');
    const uid = account.uid;

    const dataToSave = {
      ...account,
      email: cleanEmail,
      username: cleanUsername,
      updatedAt: Date.now(),
    };

    try {
      if (cleanEmail) {
        await setDoc(doc(firestore, 'users', cleanEmail), dataToSave, { merge: true });
      }
      if (uid) {
        await setDoc(doc(firestore, 'users', uid), dataToSave, { merge: true });
      }
      if (cleanUsername) {
        await setDoc(
          doc(firestore, 'usernames', cleanUsername),
          {
            uid: uid || '',
            email: cleanEmail || '',
            username: cleanUsername,
            fullName: account.fullName,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('saveAccountToFirestore warning:', e);
    }
  }

  /**
   * Mendaftarkan akun baru menggunakan Firebase Authentication (createUserWithEmailAndPassword)
   * Menyimpan profil di Firestore dan sign out agar user login secara sadar.
   */
  public async registerAccount(account: RegisteredAccount): Promise<User> {
    const cleanEmail = account.email.trim().toLowerCase();
    const cleanUsername = account.username.trim().toLowerCase().replace(/^@/, '');
    const cleanFullName = account.fullName.trim();
    const password = (account.password || '').trim();

    // 1. Cek apakah email sudah terdaftar melalui akun Google
    const existing = await this.findAccount(cleanEmail);
    if (existing && existing.isGoogleLinked && !existing.hasPassword) {
      const err: any = new Error('ACCOUNT_EXISTS_WITH_GOOGLE');
      err.code = 'auth/account-exists-with-google';
      throw err;
    }

    // 2. Cek apakah username sudah dipakai oleh akun lain
    const existingUsername = await this.findAccount(cleanUsername);
    if (existingUsername && existingUsername.email && existingUsername.email.toLowerCase() !== cleanEmail) {
      const err: any = new Error('USERNAME_TAKEN');
      err.code = 'auth/username-already-in-use';
      throw err;
    }

    // 3. Buat akun di Firebase Auth asli
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = credential.user;

    // 4. Perbarui nama tampilan di Firebase Auth
    try {
      await updateProfile(user, { displayName: cleanFullName });
    } catch (e) {
      console.warn('updateProfile error:', e);
    }

    // 5. Simpan data profil pengguna di Firestore
    const newAcc: RegisteredAccount = {
      uid: user.uid,
      fullName: cleanFullName,
      displayName: cleanFullName,
      username: cleanUsername,
      email: cleanEmail,
      isGoogleLinked: false,
      hasPassword: true,
      authProviders: ['password'],
      avatarUrl: account.avatarUrl || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveAccountToFirestore(newAcc);

    // 6. Sign out setelah pendaftaran agar pengguna masuk dengan kredensial yang valid
    try {
      await signOut(auth);
    } catch {}

    return user;
  }

  /**
   * Login menggunakan Firebase Auth (signInWithEmailAndPassword)
   * Mendukung input berupa Email lengkap maupun Username.
   * Menangani akun Google tanpa memunculkan pesan keliru "Akun belum terdaftar".
   */
  public async loginWithCredentials(
    identifier: string,
    passwordInput: string
  ): Promise<{ user: User; account: RegisteredAccount }> {
    const rawId = identifier.trim();
    const cleanPw = passwordInput.trim();

    if (!rawId) {
      const err: any = new Error('EMPTY_IDENTIFIER');
      err.code = 'auth/empty-identifier';
      throw err;
    }
    if (!cleanPw) {
      const err: any = new Error('EMPTY_PASSWORD');
      err.code = 'auth/empty-password';
      throw err;
    }

    let targetEmail = '';
    let accountProfile: RegisteredAccount | null = null;

    // A. Analisis apakah input merupakan format Email atau Username
    if (rawId.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawId)) {
        const err: any = new Error('INVALID_EMAIL_FORMAT');
        err.code = 'auth/invalid-email-format';
        throw err;
      }
      targetEmail = rawId.toLowerCase();
      // Cari profil akun di Firestore
      accountProfile = await this.findAccount(targetEmail);
    } else {
      // Input adalah Username (tanpa @)
      const cleanUsername = rawId.replace(/^@/, '').toLowerCase();
      accountProfile = await this.findAccount(cleanUsername);

      if (!accountProfile || !accountProfile.email) {
        const err: any = new Error('USERNAME_NOT_FOUND');
        err.code = 'auth/username-not-found';
        err.username = cleanUsername;
        throw err;
      }

      targetEmail = accountProfile.email.toLowerCase();
    }

    // B. Jalankan autentikasi Firebase Auth SDK
    try {
      const credential = await signInWithEmailAndPassword(auth, targetEmail, cleanPw);
      const user = credential.user;

      // Ambil atau perbarui profil jika belum ada
      if (!accountProfile) {
        accountProfile = await this.findAccount(targetEmail);
      }
      if (!accountProfile) {
        accountProfile = {
          uid: user.uid,
          fullName: user.displayName || targetEmail.split('@')[0],
          displayName: user.displayName || targetEmail.split('@')[0],
          username: (rawId.includes('@') ? rawId.split('@')[0] : rawId).replace(/[^a-zA-Z0-9_]/g, ''),
          email: targetEmail,
          isGoogleLinked: false,
          hasPassword: true,
          authProviders: ['password'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await this.saveAccountToFirestore(accountProfile);
      } else if (!accountProfile.hasPassword) {
        accountProfile.hasPassword = true;
        if (!accountProfile.authProviders?.includes('password')) {
          accountProfile.authProviders = [...(accountProfile.authProviders || []), 'password'];
        }
        await this.saveAccountToFirestore(accountProfile);
      }

      return { user, account: accountProfile };
    } catch (authError: any) {
      // C. Analisis error kredensial dari Firebase Auth
      if (
        authError?.code === 'auth/invalid-credential' ||
        authError?.code === 'auth/user-not-found'
      ) {
        // Cek apakah akun ada di database Firestore
        if (accountProfile) {
          // Jika akun terdaftar via Google dan belum memiliki kata sandi mandiri
          if (accountProfile.isGoogleLinked && !accountProfile.hasPassword) {
            const err: any = new Error('GOOGLE_ONLY_ACCOUNT');
            err.code = 'auth/google-only-account';
            err.email = targetEmail;
            err.username = accountProfile.username;
            err.fullName = accountProfile.fullName;
            throw err;
          }

          // Akun ada di database, artinya kata sandi yang dimasukkan salah
          const err: any = new Error('WRONG_PASSWORD');
          err.code = 'auth/wrong-password';
          throw err;
        }

        // Akun sama sekali tidak terdaftar
        const err: any = new Error('USER_NOT_FOUND');
        err.code = 'auth/user-not-found';
        throw err;
      }

      // Teruskan error lainnya (misalnya auth/too-many-requests)
      throw authError;
    }
  }

  /**
   * Kirim email reset kata sandi (bisa digunakan untuk akun email maupun akun Google yang ingin membuat kata sandi)
   */
  public async sendPasswordReset(identifier: string): Promise<string> {
    const rawId = identifier.trim();
    if (!rawId) throw new Error('EMPTY_IDENTIFIER');

    let targetEmail = rawId;
    if (!rawId.includes('@')) {
      const acc = await this.findAccount(rawId);
      if (acc && acc.email) {
        targetEmail = acc.email;
      } else {
        const err: any = new Error('USERNAME_NOT_FOUND');
        err.code = 'auth/username-not-found';
        err.username = rawId;
        throw err;
      }
    }

    await sendPasswordResetEmail(auth, targetEmail.toLowerCase());
    return targetEmail.toLowerCase();
  }

  /**
   * Login Google Resmi menggunakan Firebase Auth SDK (signInWithPopup / signInWithRedirect)
   */
  public async initiateGoogleAuth(): Promise<{ mode: 'popup'; user: User } | { mode: 'redirect' }> {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return { mode: 'popup', user: res.user };
    } catch (err: any) {
      // Fallback ke redirect jika popup terblokir oleh browser
      if (err?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return { mode: 'redirect' };
      }
      throw err;
    }
  }

  /**
   * Cek hasil redirect OAuth Google saat halaman dibuka kembali
   */
  public async checkRedirectResult(): Promise<User | null> {
    try {
      const res = await getRedirectResult(auth);
      return res ? res.user : null;
    } catch (err) {
      console.warn('checkRedirectResult warning:', err);
      throw err;
    }
  }
}

export const authService = new AuthService();
