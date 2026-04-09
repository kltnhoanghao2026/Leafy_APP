import { useLocalSearchParams } from "expo-router";
import { PostDetailScreen } from "@/src/features/community/components/PostDetailScreen";

export default function PostDetailRoute() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  return <PostDetailScreen postId={postId ?? ""} />;
}
