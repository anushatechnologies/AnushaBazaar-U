/**
 * Type declarations for @expo/vector-icons
 *
 * This module is provided by the Expo framework at runtime but does not
 * ship its own TypeScript declarations, causing the IDE to report
 * "Cannot find module '@expo/vector-icons'".
 *
 * This file silences that false-positive across the entire project.
 */
declare module "@expo/vector-icons" {
  import { ComponentType } from "react";
  import { TextStyle, ViewStyle } from "react-native";

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle | any;
  }

  type IconComponent = ComponentType<IconProps> & {
    glyphMap: Record<string, number>;
  };

  export const Ionicons: IconComponent;
  export const MaterialCommunityIcons: IconComponent;
  export const MaterialIcons: IconComponent;
  export const FontAwesome: IconComponent;
  export const FontAwesome5: IconComponent;
  export const Feather: IconComponent;
  export const AntDesign: IconComponent;
  export const Entypo: IconComponent;
  export const EvilIcons: IconComponent;
  export const Foundation: IconComponent;
  export const Octicons: IconComponent;
  export const SimpleLineIcons: IconComponent;
  export const Zocial: IconComponent;
}
