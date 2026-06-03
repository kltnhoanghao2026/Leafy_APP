import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Check } from "lucide-react-native";
import { MotiView } from "moti";

import type { Step } from "./predict.types";

type StepIndicatorProps = {
  step: Step;
  palette: { primary: string };
  onStepPress?: (step: Step) => void;
};

const STEP_MAP: Record<Step, number> = { pick: 1, detect: 2, result: 3 };
const REVERSE_STEP_MAP: Record<number, Step> = { 1: "pick", 2: "detect", 3: "result" };

export default function StepIndicator({ step, palette, onStepPress }: StepIndicatorProps) {
  const stepNumber = STEP_MAP[step];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        gap: 6,
      }}
    >
      {[1, 2, 3].map((s) => {
        const isActive = s === stepNumber;
        const isCompleted = s < stepNumber;

        return (
          <React.Fragment key={s}>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={!isCompleted}
              onPress={() => {
                if (isCompleted && onStepPress) {
                  onStepPress(REVERSE_STEP_MAP[s]);
                }
              }}
            >
              <MotiView
                animate={{
                  backgroundColor: isCompleted || isActive ? palette.primary : `${palette.primary}15`,
                  scale: isActive ? 1.15 : 1,
                }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 120,
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: isActive ? palette.primary : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isActive ? 0.4 : 0,
                  shadowRadius: 8,
                  elevation: isActive ? 6 : 0,
                }}
              >
                {isCompleted ? (
                  <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "timing", duration: 250 }}
                  >
                    <Check size={16} color="#FFF" strokeWidth={3} />
                  </MotiView>
                ) : (
                  <Text
                    style={{
                      color: isActive ? "#FFF" : palette.primary,
                      fontSize: 14,
                      fontWeight: "800",
                    }}
                  >
                    {s}
                  </Text>
                )}
              </MotiView>
            </TouchableOpacity>
            {s < 3 && (
              <View
                style={{
                  width: 40,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: `${palette.primary}15`,
                  overflow: "hidden",
                }}
              >
                <MotiView
                  animate={{
                    width: s < stepNumber ? 40 : 0,
                  }}
                  transition={{
                    type: "timing",
                    duration: 350,
                  }}
                  style={{
                    height: "100%",
                    backgroundColor: palette.primary,
                  }}
                />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
