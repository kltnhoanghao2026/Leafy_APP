import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

interface AuthLegalFooterProps {
  palette: any;
}

export function AuthLegalFooter({ palette }: AuthLegalFooterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.legalFooter}>
      <View style={styles.legalRow}>
        <TouchableOpacity>
          <Text
            style={[styles.legalText, { color: palette.textInputPlaceholder }]}
          >
            {t("auth.legal.terms")}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.legalDot, { color: palette.textInputPlaceholder }]}>
          •
        </Text>
        <TouchableOpacity>
          <Text
            style={[styles.legalText, { color: palette.textInputPlaceholder }]}
          >
            {t("auth.legal.privacy")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legalFooter: {
    gap: 12,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: "center",
  },
  legalRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  legalText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalDot: {
    fontSize: 12,
  },
});
