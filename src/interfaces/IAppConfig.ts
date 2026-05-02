export interface IAppConfig {
  hostname: string;
  siteTitle: string;
  server: string;
  /** Whether TOTP two-factor authentication is available on this deployment. */
  totpAvailable?: boolean;
}
