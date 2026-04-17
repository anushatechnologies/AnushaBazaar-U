import { useEffect } from "react";
import { Platform } from "react-native";
import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from "sp-react-native-in-app-updates";

const inAppUpdates = new SpInAppUpdates(
  false // isDebug
);

export const useInAppUpdate = () => {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // curVersion is heavily optional for Android since Play Store handles the diff.
        const result = await inAppUpdates.checkNeedsUpdate();
        if (result.shouldUpdate) {
          let updateOptions: StartUpdateOptions = {};

          if (Platform.OS === "android") {
            // IMMEDIATE forces the full-screen mandatory Google Play update UI directly inside the app
            // without pushing them outside to the Google Play app.
            updateOptions = {
              updateType: IAUUpdateKind.IMMEDIATE,
            };
          }

          if (Platform.OS === "ios") {
            // iOS gives an alert to push them to the store
            updateOptions = {
              title: "Update Available",
              message: "A new version of Anusha Bazaar is available!",
              buttonUpgradeText: "Update Now",
              buttonCancelText: "Cancel",
            };
          }

          // Start the update
          inAppUpdates.startUpdate(updateOptions);
        }
      } catch (e) {
        console.log("In-App Update Error:", e);
      }
    };

    // Delay the check slightly to let the app finish booting
    setTimeout(() => {
      checkUpdate();
    }, 2000);
  }, []);
};
