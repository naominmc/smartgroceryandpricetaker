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
  googleProvider,
  type User,
} from './firebase';

export interface RegisteredAccount {
  uid?: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  isGoogleLinked?: boolean;
  avatarUrl?: string;
  createdAt?: number;
  isPwaDismissed?: boolean;
}

class AuthService {
  /**
   * Cari akun profil pengguna di Firestore berdasarkan email atau username
   */
  public async findAccount(identifier: string): Promise<RegisteredAccount | null> {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    if (!cleanId) return null;

    try {
      // 1. Coba berdasarkan email sebagai ID dokumen
      const docRef = doc(firestore, 'users', cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as RegisteredAccount;
      }

      // 2. Coba query Firestore berdasarkan username
      const usersCol = collection(firestore, 'users');
      const qUsername = query(usersCol, where('username', '==', cleanId));
      const queryUserSnap = await getDocs(qUsername);
      if (!queryUserSnap.empty) {
        return queryUserSnap.docs[0].data() as RegisteredAccount;
      }

      // 3. Coba query Firestore berdasarkan field email
      const qEmail = query(usersCol, where('email', '==', cleanId));
      const queryEmailSnap = await getDocs(qEmail);
      if (!queryEmailSnap.empty) {
        return queryEmailSnap.docs[0].data() as RegisteredAccount;
      }
    } catch (e) {
      console.warn('Firestore findAccount warning:', e);
    }

    return null;
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

    // 1. Buat akun di Firebase Auth asli
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = credential.user;

    // 2. Perbarui nama tampilan di Firebase Auth
    try {
      await updateProfile(user, { displayName: cleanFullName });
    } catch (e) {
      console.warn('updateProfile error:', e);
    }

    // 3. Simpan data profil pengguna di Firestore
    const newAcc: RegisteredAccount = {
      uid: user.uid,
      fullName: cleanFullName,
      username: cleanUsername,
      email: cleanEmail,
      isGoogleLinked: false,
      avatarUrl: account.avatarUrl || '',
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(firestore, 'users', cleanEmail), newAcc);
    } catch (e) {
      console.warn('Firestore save user warning:', e);
    }

    // 4. Sign out setelah pendaftaran agar pengguna masuk dengan kredensial yang valid
    try {
      await signOut(auth);
    } catch {}

    return user;
  }

  /**
   * Login sungguhan menggunakan Firebase Auth (signInWithEmailAndPassword)
   * Mendukung input berupa email langsung atau username yang terdaftar di Firestore.
   */
  public async loginWithCredentials(
    identifier: string,
    passwordInput: string
  ): Promise<{ user: User; account: RegisteredAccount }> {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    const cleanPw = passwordInput.trim();

    if (!cleanId) throw new Error('EMPTY_IDENTIFIER');
    if (!cleanPw) throw new Error('EMPTY_PASSWORD');

    let targetEmail = cleanId;

    // Jika input bukan email (tidak ada '@'), cari email dari username di Firestore
    if (!cleanId.includes('@')) {
      const existing = await this.findAccount(cleanId);
      if (existing && existing.email) {
        targetEmail = existing.email.toLowerCase();
      }
    }

    // Jalankan autentikasi resmi Firebase Auth SDK
    const credential = await signInWithEmailAndPassword(auth, targetEmail, cleanPw);
    const user = credential.user;

    // Ambil data profil dari Firestore
    let account = await this.findAccount(targetEmail);
    if (!account) {
      account = {
        uid: user.uid,
        fullName: user.displayName || targetEmail.split('@')[0],
        username: (cleanId.includes('@') ? cleanId.split('@')[0] : cleanId).replace(/[^a-zA-Z0-9_]/g, ''),
        email: targetEmail,
        isGoogleLinked: false,
      };
      try {
        await setDoc(doc(firestore, 'users', targetEmail), account);
      } catch {}
    }

    return { user, account };
  }

  /**
   * Login Google Resmi menggunakan Firebase Auth SDK (signInWithPopup / signInWithRedirect)
   * Membuka popup resmi accounts.google.com ke grocerytracker-9ef9b.firebaseapp.com
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

  /**
   * Simpan atau update dokumen pengguna ke Firestore
   */
  public async saveAccountToFirestore(account: RegisteredAccount): Promise<void> {
    const cleanEmail = account.email.trim().toLowerCase();
    try {
      await setDoc(doc(firestore, 'users', cleanEmail), account, { merge: true });
    } catch (e) {
      console.warn('saveAccountToFirestore warning:', e);
    }
  }
}

export const authService = new AuthService();
