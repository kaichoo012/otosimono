
// ========================================
// 学内落し物システム
// localStorageによるデータ保存機能
// ========================================

const STORAGE_KEY = "lostAndFoundReports";

// ----------------------------------------
// サンプルデータ
// ----------------------------------------

const sampleItems = [
  {
    id: "sample-1",
    type: "発見報告",
    name: "青い水筒",
    category: "日用品",
    location: "70号館",
    date: "2026-10-18",
    feature: "青色、約500ml。無地の水筒です。",
    storage: "学生課",
    status: "保管中",
    photos: []
  },
  {
    id: "sample-2",
    type: "発見報告",
    name: "白い水筒",
    category: "日用品",
    location: "食堂",
    date: "2026-10-16",
    feature: "白色の水筒。側面に小さな傷があります。",
    storage: "学生課",
    status: "保管中",
    photos: []
  },
  {
    id: "sample-3",
    type: "発見報告",
    name: "学生証",
    category: "学生証",
    location: "70号館",
    date: "2026-10-15",
    feature: "学生証が届けられています。",
    storage: "学生課",
    status: "保管中",
    photos: []
  }
];

// ----------------------------------------
// データの読み込み・保存
// ----------------------------------------

function getReports() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("データの読み込みに失敗しました。", error);
    return [];
  }
}

function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return true;
  } catch (error) {
    console.error("データの保存に失敗しました。", error);
    return false;
  }
}

// 発見報告だけを一覧に表示する
function getAllItems() {
  const reports = getReports();

  const foundReports = reports.filter(report => {
    return report.type === "発見報告" ||
           report.type === "found";
  });

  return [...sampleItems, ...foundReports];
}

// ----------------------------------------
// 日付の表示形式
// ----------------------------------------

function formatDate(date) {
  if (!date) {
    return "";
  }

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[0]}/${parts[1]}/${parts[2]}`;
}

// ----------------------------------------
// HTMLエスケープ
// ----------------------------------------

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

// ----------------------------------------
// 写真の圧縮
// ----------------------------------------

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");

        let width = image.width;
        let height = image.height;

        const maxSize = 1000;

        if (width > maxSize || height > maxSize) {
          const scale = Math.min(
            maxSize / width,
            maxSize / height
          );

          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(image, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.7);

        resolve(compressed);
      };

      image.onerror = reject;
      image.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========================================
// 1. 落し物一覧画面
// ========================================

const itemsGrid = document.getElementById("itemsGrid");

if (itemsGrid) {
  const searchForm = document.getElementById("searchForm");
  const keywordInput = document.getElementById("keyword");
  const categoryFilter = document.getElementById("category");
  const locationFilter = document.getElementById("location");
  const dateFilter = document.getElementById("foundDate");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");

  // 落し物一覧の表示
  function displayItems(items) {
    itemsGrid.innerHTML = "";

    resultCount.textContent =
      `${items.length}件の落し物が見つかりました`;

    if (items.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "item-card";

      // 写真
      const photo = document.createElement("div");
      photo.className = "item-photo";

      if (item.photos && item.photos.length > 0) {
        const image = document.createElement("img");

        image.src = item.photos[0];
        image.alt = item.name;
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "contain";

        photo.appendChild(image);
      } else {
        photo.textContent = "写真";
      }

      // 情報
      const info = document.createElement("div");
      info.className = "item-info";

      const title = document.createElement("h3");
      title.textContent = item.name;

      const category = document.createElement("p");
      category.className = "item-meta";
      category.textContent = `分類：${item.category}`;

      const location = document.createElement("p");
      location.className = "item-meta";
      location.textContent = `場所：${item.location}`;

      const date = document.createElement("p");
      date.className = "item-meta";
      date.textContent = `発見日：${formatDate(item.date)}`;

      // 詳細ボタン
      const link = document.createElement("a");
      link.href = `detail.html?id=${encodeURIComponent(item.id)}`;
      link.className = "item-link";
      link.textContent = "詳細を見る";

      info.appendChild(title);
      info.appendChild(category);
      info.appendChild(location);
      info.appendChild(date);
      info.appendChild(link);

      card.appendChild(photo);
      card.appendChild(info);

      itemsGrid.appendChild(card);
    });
  }

  // 検索処理
  function searchItems() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const location = locationFilter.value;
    const date = dateFilter.value;

    const allItems = getAllItems();

    const filteredItems = allItems.filter(item => {
      const name = (item.name || "").toLowerCase();
      const feature = (item.feature || "").toLowerCase();

      const matchKeyword =
        name.includes(keyword) ||
        feature.includes(keyword);

      const matchCategory =
        category === "" || item.category === category;

      const matchLocation =
        location === "" || item.location === location;

      const matchDate =
        date === "" || item.date === date;

      return (
        matchKeyword &&
        matchCategory &&
        matchLocation &&
        matchDate
      );
    });

    displayItems(filteredItems);
  }

  // 検索フォーム送信
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    searchItems();
  });

  // 検索条件をクリア
  searchForm.addEventListener("reset", () => {
    setTimeout(() => {
      displayItems(getAllItems());
    }, 0);
  });

  // 初期表示
  displayItems(getAllItems());
}

// ========================================
// 2. 落し物詳細画面
// ========================================

const mainPhoto = document.getElementById("mainPhoto");

if (mainPhoto) {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");

  const allItems = getAllItems();

  const item = allItems.find(data => {
    return String(data.id) === String(itemId);
  }) || sampleItems[0];

  // 落し物情報の表示
  document.getElementById("detailName").textContent = item.name;
  document.getElementById("detailCategory").textContent = item.category;
  document.getElementById("detailLocation").textContent = item.location;
  document.getElementById("detailDate").textContent = formatDate(item.date);
  document.getElementById("detailFeature").textContent = item.feature;

  const status = document.querySelector(".status");

  if (status) {
    status.textContent = item.status || "保管中";
  }

  // 写真表示
  const photos = item.photos || [];
  let currentPhoto = 0;

  const photoCount = document.getElementById("photoCount");

  function showPhoto() {
    mainPhoto.innerHTML = "";

    if (photos.length === 0) {
      mainPhoto.textContent = "写真はありません";
      photoCount.textContent = "0 / 0";
      return;
    }

    const image = document.createElement("img");

    image.src = photos[currentPhoto];
    image.alt = `${item.name}の写真 ${currentPhoto + 1}`;
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "contain";

    mainPhoto.appendChild(image);

    photoCount.textContent =
      `${currentPhoto + 1} / ${photos.length}`;
  }

  // 前の写真
  document.getElementById("prevPhoto").addEventListener("click", () => {
    if (photos.length === 0) {
      return;
    }

    currentPhoto--;

    if (currentPhoto < 0) {
      currentPhoto = photos.length - 1;
    }

    showPhoto();
  });

  // 次の写真
  document.getElementById("nextPhoto").addEventListener("click", () => {
    if (photos.length === 0) {
      return;
    }

    currentPhoto++;

    if (currentPhoto >= photos.length) {
      currentPhoto = 0;
    }

    showPhoto();
  });

  showPhoto();
}

// ========================================
// 3. 紛失・発見報告画面
// ========================================

const reportForm = document.getElementById("reportForm");

if (reportForm) {
  const tabs = document.querySelectorAll(".report-tabs .tab");
  const reportKind = document.getElementById("reportKind");

  const photosInput = document.getElementById("photos");
  const preview = document.getElementById("preview");
  const formMessage = document.getElementById("formMessage");
  const dateLabel = document.getElementById("dateLabel");

  let selectedPhotos = [];

  // 初期値を発見報告にする
  reportKind.value = "発見報告";

  // 報告種別の切り替え
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(button => {
        button.classList.remove("active");
      });

      tab.classList.add("active");

      reportKind.value =
        tab.dataset.kind === "lost" ? "紛失報告" : "発見報告";

      const dateText =
        reportKind.value === "lost" ? "紛失日時" : "発見日時";

      dateLabel.innerHTML =
        `${dateText} <span class="required">*</span>
         <input id="reportDate" type="date" required>`;

      formMessage.textContent = "";
    });
  });

  // 写真選択・プレビュー
  photosInput.addEventListener("change", async () => {
    preview.innerHTML = "";
    selectedPhotos = [];

    const files = Array.from(photosInput.files);

    if (files.length === 0) {
      return;
    }

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          alert("画像ファイルを選択してください。");
          continue;
        }

        const compressed = await compressImage(file);

        selectedPhotos.push(compressed);

        const image = document.createElement("img");
        image.src = compressed;
        image.alt = "選択した写真";

        preview.appendChild(image);
      }
    } catch (error) {
      alert("写真の読み込みに失敗しました。");
      console.error(error);
    }
  });

  // ----------------------------------------
  // 報告内容の確認
  // ----------------------------------------

  reportForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("reportName").value.trim();
    const category = document.getElementById("reportCategory").value;
    const date = document.getElementById("reportDate").value;
    const location = document.getElementById("reportLocation").value;
    const feature = document.getElementById("reportFeature").value.trim();

    if (!name || !category || !date || !location || !feature) {
      formMessage.textContent = "必須項目を入力してください。";
      return;
    }

    const type = reportKind.value;

    // 入力内容を保存しておく
    const reportData = {
      type: type,
      name: name,
      category: category,
      date: date,
      location: location,
      feature: feature,
      photos: selectedPhotos
    };

    // 確認画面を表示
    reportForm.innerHTML = `
      <h2>入力内容の確認</h2>

      <div class="confirm-info">
        <p><strong>報告種別：</strong>${escapeHTML(reportData.type)}</p>
        <p><strong>名称：</strong>${escapeHTML(reportData.name)}</p>
        <p><strong>分類：</strong>${escapeHTML(reportData.category)}</p>
        <p><strong>日時：</strong>${formatDate(reportData.date)}</p>
        <p><strong>場所：</strong>${escapeHTML(reportData.location)}</p>
        <p><strong>特徴：</strong>${escapeHTML(reportData.feature)}</p>
        <p><strong>写真：</strong>${reportData.photos.length}枚</p>
      </div>

      <div class="form-actions">
        <button type="button" id="backButton" class="btn-text">
          入力画面に戻る
        </button>

        <button type="button" id="saveButton" class="btn-primary">
          この内容で登録する
        </button>
      </div>
    `;

    // 入力画面に戻る
    document.getElementById("backButton").addEventListener("click", () => {
      location.reload();
    });

    // ----------------------------------------
    // 登録処理
    // ----------------------------------------

    document.getElementById("saveButton").addEventListener("click", () => {
      const newReport = {
        id: "report-" + Date.now(),
        type: reportData.type,
        name: reportData.name,
        category: reportData.category,
        date: reportData.date,
        location: reportData.location,
        feature: reportData.feature,
        storage: "学生課",
        status: "保管中",
        photos: reportData.photos
      };

      const reports = getReports();

      reports.push(newReport);

      if (saveReports(reports)) {
        // 登録完了画面
        reportForm.innerHTML = `
          <h2>登録が完了しました</h2>

          <p>報告内容を保存しました。</p>

          <div class="form-actions">
            <a href="index.html" class="btn-primary">
              落し物一覧に戻る
            </a>

            <a href="report.html" class="btn-text">
              続けて報告する
            </a>
          </div>
        `;
      } else {
        alert("保存に失敗しました。写真の容量を減らして再度お試しください。");
      }
    });
  });
}
