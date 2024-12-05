<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>

    <!-- modifikasi src/views/HomePage.vue pada bagian ion-content dalam template -->
    <ion-content :fullscreen="true">
      <!-- komponen paling atas dari ion-content -->
      <ion-refresher
        slot="fixed"
        :pull-factor="0.5"
        :pull-min="100"
        :pull-max="200"
        @ionRefresh="handleRefresh($event)"
      >
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- komponen utama di antara 2 komponen ini -->
      <!-- bagian refresher -->

      <!-- active Toys -->
      <div class="scrollable-container">
        <ion-list>
          <ion-item-sliding
            v-for="toy in activeToys"
            :key="toy.id"
            :ref="(el) => setItemRef(el, toy.id!)"
          >
            <ion-item-options side="start" @ionSwipe="handleDelete(toy)">
              <ion-item-option
                color="danger"
                expandable
                @click="handleDelete(toy)"
              >
                <ion-icon
                  slot="icon-only"
                  :icon="trash"
                  size="large"
                ></ion-icon>
              </ion-item-option>
            </ion-item-options>

            <ion-item>
              <ion-card>
                <ion-card-header>
                  <ion-card-title class="ion-text-wrap limited-text">{{
                    toy.toy
                  }}</ion-card-title>
                  <ion-card-subtitle class="limited-text">{{
                    toy.story
                  }}</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                  <ion-badge>{{ getRelativeTime(toy.updatedAt) }}</ion-badge>
                </ion-card-content>
              </ion-card>
            </ion-item>

            <ion-item-options side="end">
              <ion-item-option @click="handleEdit(toy)">
                <ion-icon
                  slot="icon-only"
                  :icon="create"
                  size="large"
                ></ion-icon>
              </ion-item-option>
              
            </ion-item-options>
          </ion-item-sliding>
          <ion-item v-if="activeToys.length === 0" class="ion-text-center">
            <ion-label>No active Toys</ion-label>
          </ion-item>
        </ion-list>
      </div>

      

      <!-- bagian tombol dan modal -->

      <!-- komponen paling bawah dari ion-content -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="isOpen = true">
          <ion-icon :icon="add" size="large"></ion-icon>
        </ion-fab-button>
      </ion-fab>
      <InputModal
        v-model:isOpen="isOpen"
        v-model:editingId="editingId"
        :toy="toy"
        @submit="handleSubmit"
      />
    </ion-content>
  </ion-page>
</template>

<!-- modifikasi src/views/HomePage.vue import semua komponen yang diperlukan -->
<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonFab,
  IonFabButton,
  IonAccordion,
  IonAccordionGroup,
  IonLabel,
  IonList,
  loadingController,
  IonRefresher,
  IonRefresherContent,
  toastController,
} from "@ionic/vue";
import {
  add,
  checkmarkCircle,
  close,
  create,
  trash,
  closeCircle,
  warningOutline,
} from "ionicons/icons";
import InputModal from "@/components/InputModal.vue";
import { onMounted, ref, computed, onUnmounted } from "vue";
import { firestoreService, type Toy } from "@/utils/firestore";
import { formatDistanceToNow } from "date-fns";

// modifikasi src/views/HomePage.vue deklarasikan variabel yang akan digunakan
const isOpen = ref(false);
const editingId = ref<string | null>(null);
const toys = ref<Toy[]>([]);
const toy = ref<Omit<Toy, "id" | "createdAt" | "updatedAt" | "status">>({
  toy: "",
  story: "",
});
const activeToys = computed(() => toys.value.filter((toy) => !toy.status));
const completedToys = computed(() => toys.value.filter((toy) => toy.status));
const itemRefs = ref<Map<string, HTMLIonItemSlidingElement>>(new Map());
let intervalId: any;
const timeUpdateTrigger = ref(0);

// mendapatkan value dari item
const setItemRef = (el: any, id: string) => {
  if (el) {
    itemRefs.value.set(id, el.$el);
  }
};

// toast notifikasi
const showToast = async (
  message: string,
  color: string = "success",
  icon: string = checkmarkCircle
) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: "top",
    icon,
  });
  await toast.present();
};

// mendapatkan perbedaan waktu
const getRelativeTime = (date: any) => {
  timeUpdateTrigger.value;
  try {
    const jsDate = date?.toDate ? date.toDate() : new Date(date);
    return formatDistanceToNow(jsDate, { addSuffix: true });
  } catch (error) {
    return "Invalid date";
  }
};

// handle swipe refresher
const handleRefresh = async (event: any) => {
  try {
    await loadToys(false);
  } catch (error) {
    console.error("Error refreshing:", error);
  } finally {
    event.target.complete();
  }
};

// handle submit add/edit pada modal
const handleSubmit = async (
  toy: Omit<Toy, "id" | "createdAt" | "updatedAt" | "status">
) => {
  if (!toy.toy) {
    await showToast("Toy name is required", "warning", warningOutline);
    return;
  }
  try {
    if (editingId.value) {
      await firestoreService.updateToy(editingId.value, toy as Toy);
      await showToast("Toy updated successfully", "success", checkmarkCircle);
    } else {
      await firestoreService.addToy(toy as Toy);
      await showToast("Toy added successfully", "success", checkmarkCircle);
    }
    loadToys();
  } catch (error) {
    await showToast("An error occurred", "danger", closeCircle);
    console.error(error);
  } finally {
    editingId.value = null;
  }
};

// load data
const loadToys = async (isLoading = true) => {
  let loading;
  if (isLoading) {
    loading = await loadingController.create({
      message: "Loading...",
    });
    await loading.present();
  }

  try {
    toys.value = await firestoreService.getToys();
  } catch (error) {
    console.error(error);
  } finally {
    if (loading) {
      await loading.dismiss();
    }
  }
};

// dijalankan setiap halaman diload, load data dan set interval update 1 menit
onMounted(() => {
  loadToys();
  intervalId = setInterval(() => {
    timeUpdateTrigger.value++;
  }, 60000);
});

// reset interval update
onUnmounted(() => {
  clearInterval(intervalId);
});

// handle edit click
const handleEdit = async (editToy: Toy) => {
  const slidingItem = itemRefs.value.get(editToy.id!);
  await slidingItem?.close();

  editingId.value = editToy.id!;
  toy.value = {
    toy: editToy.toy,
    story: editToy.story,
  };
  isOpen.value = true;
};

// handle delete click/swipe
const handleDelete = async (deleteToy: Toy) => {
  try {
    await firestoreService.deleteToy(deleteToy.id!);
    await showToast("Toy deleted successfully", "success", checkmarkCircle);
    loadToys();
  } catch (error) {
    await showToast("Failed to delete Toy", "danger", closeCircle);
    console.error(error);
  }
};

// handle status click/swipe, mengubah status Toy active (false)/completed (true)
const handleStatus = async (statusToy: Toy) => {
  const slidingItem = itemRefs.value.get(statusToy.id!);
  await slidingItem?.close();
  try {
    await firestoreService.updateStatus(statusToy.id!, !statusToy.status);
    await showToast(
      `Toy marked as ${!statusToy.status ? "completed" : "active"}`,
      "success",
      checkmarkCircle
    );
    loadToys();
  } catch (error) {
    await showToast("Failed to update status", "danger", closeCircle);
    console.error(error);
  }
};
</script>

<!-- modifikasi src/views/HomePage.vue tambahkan keseluruhan style -->
<style scoped>
ion-card,
ion-accordion-group {
  width: 100%;
}

ion-fab {
  margin: 25px;
}

.limited-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

ion-card-title.limited-text {
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

ion-card-subtitle.limited-text {
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.scrollable-container {
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.accordion-container {
  --padding-start: 0;
  --inner-padding-end: 0;
}

ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
}

.scrollable-container::-webkit-scrollbar {
  width: 8px;
}

.scrollable-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.scrollable-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.scrollable-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
