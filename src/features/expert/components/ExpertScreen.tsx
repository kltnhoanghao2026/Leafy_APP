import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Search, Users, X } from "lucide-react-native";
import { ExpertCard } from "./ExpertCard";
import { useExpertScreen } from "../hooks/useExpertScreen";

export function ExpertScreen() {
  const {
    t,
    palette,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    onRefresh,
    onSearch,
    searchTerm,
    cardBg,
    lineColor,
    mutedText,
    experts,
    parsedError,
    handleConsultPress,
    handleFollowPress,
    handleExpertPress,
    onEndReached,
    isLoadingConsult,
    isLoadingFollow,
  } = useExpertScreen();

  const [localSearch, setLocalSearch] = useState("");

  const handleSearchChange = (text: string) => {
    setLocalSearch(text);
  };

  const handleSearchSubmit = () => {
    onSearch(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    onSearch("");
  };

  const renderExpertCard = ({ item }: { item: typeof experts[0] }) => (
    <ExpertCard
      expert={item}
      palette={palette}
      cardBg={cardBg}
      lineColor={lineColor}
      mutedText={mutedText}
      onPress={() => handleExpertPress(item)}
      onConsultPress={() => handleConsultPress(item)}
      onFollowPress={() => handleFollowPress(item)}
      isConsulting={isLoadingConsult}
      isFollowingLoading={isLoadingFollow}
    />
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Users size={52} color={mutedText} />
        <Text style={[styles.emptyText, { color: mutedText }]}>
          {searchTerm
            ? t("expert.noResults", "Không tìm thấy chuyên gia nào.")
            : t("expert.empty", "Chưa có chuyên gia nào.")}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: palette.text }]}>
        {t("expert.header", "Danh sách chuyên gia được xác minh")}
      </Text>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor:
              palette.background === "#121212"
                ? "rgba(255,255,255,0.06)"
                : "rgba(47,127,52,0.06)",
            borderColor: lineColor,
          },
        ]}
      >
        <Search size={17} color={mutedText} style={styles.searchIcon} />
        <TextInput
          value={localSearch}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
          placeholder={t("expert.searchPlaceholder", "Tìm kiếm chuyên gia...")}
          placeholderTextColor={mutedText}
          style={[styles.searchInput, { color: palette.text }]}
          returnKeyType="search"
        />
        {localSearch.length > 0 && (
          <Pressable onPress={handleClearSearch} style={styles.clearButton}>
            <X size={16} color={mutedText} />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (isLoading && experts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.loadingText, { color: mutedText }]}>
            {t("common.loading", "Đang tải...")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={experts}
        renderItem={renderExpertCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
      />
      {isError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>
            {parsedError?.message ||
              t("expert.error", "Đã xảy ra lỗi khi tải danh sách chuyên gia.")}
          </Text>
          <Pressable
            onPress={onRefresh}
            style={[styles.retryButton, { backgroundColor: palette.primary }]}
          >
            <Text style={styles.retryButtonText}>
              {t("common.retry", "Thử lại")}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    marginBottom: 20,
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 56,
  },
  emptyText: {
    marginTop: 14,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
