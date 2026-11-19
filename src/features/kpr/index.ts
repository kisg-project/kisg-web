export { KprSimulator } from "./components/kpr-simulator";
export { PartnerBanks } from "./components/partner-banks";
export {
  annuityPayment,
  calculateKprKonvensional,
  calculateKprSyariah,
  downPaymentFromPercent,
  downPaymentPercent,
} from "./utils/calculate";
export { kprKonvensionalSchema, kprSyariahSchema } from "./schemas/kpr";
export type { KprKonvensionalInput, KprSyariahInput } from "./schemas/kpr";
