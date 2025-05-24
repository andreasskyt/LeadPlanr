export interface User {
  email: string
  firstName: string
  lastName: string
}

export interface AuthState {
  user: User | null
  isLoggedIn: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData extends User {
  password: string
  phone: string
} 