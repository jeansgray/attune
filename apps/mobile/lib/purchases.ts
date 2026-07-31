import { Platform } from "react-native";
import { PLUS_PRODUCTS, type PlusProductKey } from "@attune/shared";

/**
 * RevenueCat purchase wrapper.
 * When EXPO_PUBLIC_REVENUECAT_API_KEY_* is set and `react-native-purchases` is installed
 * in a native/EAS build, this will open the store purchase sheet.
 * In Expo Go / missing keys, callers should fall back to /billing/dev-grant.
 */
export async function purchasePlus(productKey: PlusProductKey): Promise<void> {
  const apiKey =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    throw new Error("RevenueCat not configured");
  }

  // Dynamic import so Expo Go without the native module still loads the app.
  const Purchases = (await import("react-native-purchases")).default;
  Purchases.configure({ apiKey });
  const offerings = await Purchases.getOfferings();
  const pkg =
    productKey === "yearly"
      ? offerings.current?.annual
      : offerings.current?.monthly;

  if (!pkg) {
    throw new Error(`No store package for ${PLUS_PRODUCTS[productKey].id}`);
  }

  await Purchases.purchasePackage(pkg);
}
