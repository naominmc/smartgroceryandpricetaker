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
} from './firebase';

export interface RegisteredAccount {
  fullName: string;
  username: string;
  email: string;
  password: string;
  isGoogleLinked?: boolean;
  avatarUrl?: string;
  createdAt?: number;
  isPwaDismissed?: boolean;
}

const LOCAL_ACCOUNTS_KEY = 'sg_registered_users';

export const getInitialSeededAccount = (): RegisteredAccount => {
  return {
    fullName: (typeof window !== 'undefined' && localStorage.getItem('sg_fullName')) || 'Naomi Miracle',
    username: ((typeof window !== 'undefined' && localStorage.getItem('sg_username')) || 'naomiiracle').replace(/^@/, ''),
    email: ((typeof window !== 'undefined' && localStorage.getItem('sg_email')) || 'naomi@mutiarabangsa.sch.id').toLowerCase(),
    password: (typeof window !== 'undefined' && localStorage.getItem('sg_password')) || 'naomi12345',
    isGoogleLinked: true,
  };
};

export const getLocalAccounts = (): RegisteredAccount[] => {
  if (typeof window === 'undefined') return [getInitialSeededAccount()];
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const defaultAcc = getInitialSeededAccount();
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify([defaultAcc]));
  return [defaultAcc];
};

export const saveLocalAccounts = (accs: RegisteredAccount[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accs));
  }
};

class AuthService {
  /**
   * Cari akun berdasarkan email atau username dari Firestore dan cache lokal
   */
  public async findAccount(identifier: string): Promise<RegisteredAccount | null> {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    if (!cleanId) return null;

    // 1. Coba dari Firestore berdasarkan email dokumen
    try {
      const docRef = doc(firestore, 'users', cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as RegisteredAccount;
        return data;
      }
    } catch {}

    // 2. Coba query Firestore berdasarkan field email atau username
    try {
      const usersCol = collection(firestore, 'users');
      const qEmail = query(usersCol, where('email', '==', cleanId));
      const querySnap = await getDocs(qEmail);
      if (!querySnap.empty) {
        return querySnap.docs[0].data() as RegisteredAccount;
      }

      const qUsername = query(usersCol, where('username', '==', cleanId));
      const queryUserSnap = await getDocs(qUsername);
      if (!queryUserSnap.empty) {
        return queryUserSnap.docs[0].data() as RegisteredAccount;
      }
    } catch {}

    // 3. Fallback ke local cache
    const local = getLocalAccounts();
    const found = local.find(
      (a) => a.email.toLowerCase() === cleanId || a.username.toLowerCase() === cleanId
    );
    return found || null;
  }

  /**
   * Mendaftarkan akun baru (Email + Password + Username + Nama Lengkap)
   * Menyimpan ke Firebase Auth & Firestore, kemudian SIGN OUT sehingga user wajib login ulang.
   */
  public async registerAccount(account: RegisteredAccount): Promise<RegisteredAccount> {
    const cleanEmail = account.email.trim().toLowerCase();
    const cleanUsername = account.username.trim().toLowerCase().replace(/^@/, '');
    const cleanFullName = account.fullName.trim();
    const password = account.password.trim();

    // Pastikan tidak duplikat
    const existing = await this.findAccount(cleanEmail);
    if (existing && existing.email.toLowerCase() === cleanEmail) {
      throw new Error('EMAIL_EXISTS');
    }
    const existingUser = await this.findAccount(cleanUsername);
    if (existingUser && existingUser.username.toLowerCase() === cleanUsername) {
      throw new Error('USERNAME_EXISTS');
    }

    // 1. Buat akun di Firebase Auth
    let authCreated = false;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (userCredential.user) {
        authCreated = true;
        try {
          await updateProfile(userCredential.user, { displayName: cleanFullName });
        } catch {}
      }
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error('EMAIL_EXISTS');
      }
      if (err?.code === 'auth/weak-password') {
        throw new Error('WEAK_PASSWORD');
      }
      console.warn('Firebase Auth create error (will still persist in Firestore):', err);
    }

    const newAcc: RegisteredAccount = {
      fullName: cleanFullName,
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      isGoogleLinked: !!account.isGoogleLinked,
      avatarUrl: account.avatarUrl || '',
      createdAt: Date.now(),
    };

    // 2. Simpan profil lengkap di Firestore
    try {
      await setDoc(doc(firestore, 'users', cleanEmail), newAcc);
    } catch (e) {
      console.warn('Firestore set user error:', e);
    }

    // 3. Update cache lokal
    const local = getLocalAccounts();
    const updated = [
      ...local.filter(
        (a) => a.email.toLowerCase() !== cleanEmail && a.username.toLowerCase() !== cleanUsername
      ),
      newAcc,
    ];
    saveLocalAccounts(updated);

    // 4. Wajib Sign Out agar pengguna diarahkan login ulang
    try {
      await signOut(auth);
    } catch {}

    return newAcc;
  }

  /**
   * Login autentikasi asli dengan Email/Username dan Kata Sandi
   */
  public async loginWithCredentials(
    identifier: string,
    passwordInput: string
  ): Promise<RegisteredAccount> {
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    const cleanPw = passwordInput.trim();

    if (!cleanId) throw new Error('EMPTY_IDENTIFIER');
    if (!cleanPw) throw new Error('EMPTY_PASSWORD');

    const account = await this.findAccount(cleanId);
    if (!account) {
      throw new Error('ACCOUNT_NOT_FOUND');
    }

    // Coba autentikasi via Firebase Auth jika menggunakan format email
    let authSuccess = false;
    if (account.email.includes('@')) {
      try {
        await signInWithEmailAndPassword(auth, account.email, cleanPw);
        authSuccess = true;
      } catch (err: any) {
        if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
          // Check password in stored document as fallback
          if (account.password && account.password !== cleanPw) {
            throw new Error('WRONG_PASSWORD');
          }
        }
      }
    }

    if (!authSuccess && account.password && account.password !== cleanPw) {
      throw new Error('WRONG_PASSWORD');
    }

    return account;
  }

  /**
   * Deteksi apakah sedang berjalan di perangkat mobile / Safari iOS
   */
  public isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))
    );
  }

  /**
   * Simpan atau perbarui akun pengguna di Firestore dan local cache
   */
  public async saveAccountToFirestore(account: RegisteredAccount): Promise<void> {
    const cleanEmail = account.email.trim().toLowerCase();
    try {
      await setDoc(doc(firestore, 'users', cleanEmail), account);
    } catch (e) {
      console.warn('saveAccountToFirestore error:', e);
    }
    const local = getLocalAccounts();
    const updated = [
      ...local.filter((a) => a.email.toLowerCase() !== cleanEmail),
      account,
    ];
    saveLocalAccounts(updated);
  }

  /**
   * Pendaftaran otomatis untuk akun Google baru (Sign Up otomatis)
   */
  public async autoRegisterGoogleAccount(data: {
    fullName: string;
    username: string;
    email: string;
    avatarUrl?: string;
    isGoogleLinked?: boolean;
  }): Promise<RegisteredAccount> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanUsername = data.username.trim().toLowerCase().replace(/^@/, '');
    const cleanFullName = data.fullName.trim() || 'Pengguna Google';

    const newAcc: RegisteredAccount = {
      fullName: cleanFullName,
      username: cleanUsername,
      email: cleanEmail,
      password: '', // Akun berbasis Google OAuth tidak memerlukan sandi manual
      isGoogleLinked: true,
      avatarUrl: data.avatarUrl || '',
      createdAt: Date.now(),
    };

    await this.saveAccountToFirestore(newAcc);
    return newAcc;
  }

  /**
   * Menjalankan proses login Google:
   * Menggunakan signInWithRedirect untuk mobile / Safari iOS,
   * atau signInWithPopup untuk desktop dengan fallback otomatis ke redirect jika popup terblokir.
   */
  public async initiateGoogleAuth(): Promise<
    | {
        mode: 'redirect';
      }
    | {
        mode: 'popup';
        user: any;
      }
  > {
    const isMobile = this.isMobileDevice();

    if (isMobile) {
      // Mobile Safari / Chrome: langsung gunakan redirect agar tidak terblokir popup blocker
      await signInWithRedirect(auth, googleProvider);
      return { mode: 'redirect' };
    }

    try {
      const res = await signInWithPopup(auth, googleProvider);
      return { mode: 'popup', user: res.user };
    } catch (err: any) {
      // Fallback ke redirect jika popup diblokir oleh browser
      if (err?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return { mode: 'redirect' };
      }
      throw err;
    }
  }

  /**
   * Memeriksa hasil redirect login Google saat halaman dimuat ulang
   */
  public async checkRedirectResult(): Promise<any | null> {
    try {
      const result = await getRedirectResult(auth);
      return result ? result.user : null;
    } catch (err: any) {
      console.warn('checkRedirectResult error:', err);
      throw err;
    }
  }

  /**
   * Alur Autentikasi Google Asli menggunakan signInWithPopup (kompatibilitas mundur)
   */
  public async signInWithGoogle(): Promise<{
    email: string;
    fullName: string;
    photoURL: string;
    existingAccount: RegisteredAccount | null;
  }> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const email = (user.email || '').toLowerCase();
    const fullName = user.displayName || 'Google User';
    const photoURL = user.photoURL || '';

    const existing = await this.findAccount(email);

    return {
      email,
      fullName,
      photoURL,
      existingAccount: existing,
    };
  }
}

export const authService = new AuthService();

