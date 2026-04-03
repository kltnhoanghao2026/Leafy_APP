import { PickerModal } from "@/src/components/ui/PickerModal";
import { useTranslation } from "react-i18next";

type SpeciesOption = {
  id: string;
  label: string;
};

type Props = {
  visible: boolean;
  selectedSpeciesId?: string;
  options: SpeciesOption[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (speciesId: string) => void;
};

export function SpeciesPickerModal({
  visible,
  selectedSpeciesId,
  options,
  isLoading,
  onClose,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  return (
    <PickerModal
      visible={visible}
      title={t("plant.speciesModal.title")}
      items={options}
      selectedId={selectedSpeciesId}
      isLoading={isLoading}
      searchPlaceholder={t("plant.speciesModal.searchPlaceholder")}
      emptyText={t("plant.speciesModal.noData")}
      keyExtractor={(item) => item.id}
      labelExtractor={(item) => item.label}
      subtitleExtractor={(item) => item.id}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}
