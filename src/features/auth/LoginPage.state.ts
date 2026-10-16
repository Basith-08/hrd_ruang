export interface LoginPageState {
  showPassword: boolean
}

export function createLoginPageState(): LoginPageState {
  return {
    showPassword: false,
  }
}
