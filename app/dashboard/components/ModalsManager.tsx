import PostsModal from "./PostsModal";
import ClientsModal from "./ClientsModal";
import CustomizationModal from "./CustomizationModal";
import CategoriesModal from "./CategoriesModal";

interface ModalsManagerProps {
  showPostsModal: boolean;
  showClientsModal: boolean;
  showCustomization: boolean;
  showThemeModal: boolean;
  showCategoriesModal: boolean;
  userId?: string;
  shopId: string;
  userRole?: string;
  onClosePostsModal: () => void;
  onCloseClientsModal: () => void;
  onCloseCustomizationModal: () => void;
  onCloseCategoriesModal: () => void;
  onPostDeleted?: () => void;
  onCategoryCreated?: () => void;
}

export default function ModalsManager({
  showPostsModal,
  showClientsModal,
  showCustomization,
  showThemeModal,
  showCategoriesModal,
  userId,
  shopId,
  userRole,
  onClosePostsModal,
  onCloseClientsModal,
  onCloseCustomizationModal,
  onCloseCategoriesModal,
  onPostDeleted,
  onCategoryCreated,
}: ModalsManagerProps) {
  return (
    <>
      <PostsModal
        isOpen={showPostsModal}
        onClose={onClosePostsModal}
        userId={userId}
        shopId={shopId}
        userRole={userRole}
        onPostDeleted={onPostDeleted}
      />

      <ClientsModal
        isOpen={showClientsModal}
        onClose={onCloseClientsModal}
        userId={userId}
        shopId={shopId}
        userRole={userRole}
      />

      <CustomizationModal
        isOpen={showCustomization || showThemeModal}
        onClose={onCloseCustomizationModal}
        userId={userId}
      />

      <CategoriesModal
        isOpen={showCategoriesModal}
        onClose={onCloseCategoriesModal}
        userId={userId}
        shopId={shopId}
        userRole={userRole}
        onCategoryCreated={onCategoryCreated}
      />
    </>
  );
}
