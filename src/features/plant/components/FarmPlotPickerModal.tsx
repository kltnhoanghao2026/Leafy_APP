import { PickerModal } from "@/src/components/ui/PickerModal";
import { useTranslation } from "react-i18next";

type FarmPlotOption = {
  id: string;
  label: string;
};

type Props = {
  visible: boolean;
  selectedFarmPlotId?: string;
  options: FarmPlotOption[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (farmPlotId: string) => void;
};

export function FarmPlotPickerModal({
  visible,
  selectedFarmPlotId,
  options,
  isLoading,
  onClose,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  return (
    <PickerModal
      visible={visible}
      title={t("plant.farmPlotModal.title")}
      items={options}
      selectedId={selectedFarmPlotId}
      isLoading={isLoading}
      searchPlaceholder={t("plant.farmPlotModal.searchPlaceholder")}
      emptyText={t("plant.farmPlotModal.noData")}
      keyExtractor={(item) => item.id}
      labelExtractor={(item) => item.label}
      subtitleExtractor={(item) => item.id}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}
