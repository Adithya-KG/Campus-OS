import { login } from './actions'
import styles from './login.module.css'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = await searchParams;
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>CampusOS</h1>
        <p className={styles.subtitle}>Sign in to manage your documents</p>
        
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="student_001@example.com"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="password123"
            />
          </div>
          <button formAction={login} className={styles.button}>
            Sign In
          </button>
          {resolvedParams?.message && (
            <p className={styles.error}>{resolvedParams.message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
