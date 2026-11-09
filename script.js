// =====================================
// YOUTUBE CREATOR DASHBOARD
// =====================================

// YouTube Data API key baad mein add karenge.
const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY";

// HTML ELEMENTS
const channelInput = document.getElementById("channelInput");
const loadChannelBtn = document.getElementById("loadChannelBtn");

const sidebarInput = document.getElementById("sidebarChannelInput");
const sidebarLoadBtn = document.getElementById("sidebarLoadBtn");

const channelName = document.getElementById("channelName");
const channelHandle = document.getElementById("channelHandle");
const channelDescription = document.getElementById("channelDescription");
const channelAvatar = document.getElementById("channelAvatar");

const subscriberCount = document.getElementById("subscriberCount");
const totalViews = document.getElementById("totalViews");
const totalVideos = document.getElementById("totalVideos");

const visitChannelBtn = document.getElementById("visitChannelBtn");
const latestVideos = document.getElementById("latestVideos");


// =====================================
// NUMBER FORMATTER
// =====================================

function formatNumber(number) {
  return Number(number || 0).toLocaleString("en-IN");
}


// =====================================
// YOUTUBE API REQUEST
// =====================================

async function youtubeRequest(endpoint, params = {}) {

  if (
    !YOUTUBE_API_KEY ||
    YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY"
  ) {
    throw new Error("YouTube API key abhi add nahi hui hai.");
  }

  const query = new URLSearchParams({
    ...params,
    key: YOUTUBE_API_KEY
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/${endpoint}?${query}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "YouTube API request failed."
    );
  }

  return data;
}


// =====================================
// CHANNEL ID FINDER
// =====================================

async function findChannel(channelLink) {

  let input = channelLink.trim();

  if (!input) {
    throw new Error("YouTube channel link paste karo.");
  }

  let channelId = "";

  try {

    const url = new URL(
      input.startsWith("http")
        ? input
        : "https://" + input
    );

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[0] === "channel" && parts[1]) {
      channelId = parts[1];
    }

    if (!channelId && parts[0]?.startsWith("@")) {

      const handle = parts[0].substring(1);

      const result = await youtubeRequest(
        "channels",
        {
          part: "snippet,statistics,contentDetails",
          forHandle: handle
        }
      );

      if (result.items?.length) {
        return result.items[0];
      }
    }

    if (!channelId && parts[0] === "user" && parts[1]) {

      const result = await youtubeRequest(
        "channels",
        {
          part: "snippet,statistics,contentDetails",
          forUsername: parts[1]
        }
      );

      if (result.items?.length) {
        return result.items[0];
      }
    }

  } catch (error) {

    if (error.message.includes("API")) {
      throw error;
    }

  }

  if (channelId) {

    const result = await youtubeRequest(
      "channels",
      {
        part: "snippet,statistics,contentDetails",
        id: channelId
      }
    );

    if (result.items?.length) {
      return result.items[0];
    }

  }

  throw new Error(
    "Channel nahi mila. Sahi YouTube channel link check karo."
  );
}


// =====================================
// LOAD CHANNEL DETAILS
// =====================================

async function loadChannel(link) {

  try {

    channelName.textContent = "Loading...";
    channelHandle.textContent = "Please wait...";
    channelDescription.textContent = "Fetching channel details...";

    subscriberCount.textContent = "...";
    totalViews.textContent = "...";
    totalVideos.textContent = "...";

    const channel = await findChannel(link);

    const snippet = channel.snippet;
    const stats = channel.statistics;

    const channelId = channel.id;

    // CHANNEL INFORMATION

    channelName.textContent = snippet.title;

    channelHandle.textContent =
      snippet.customUrl || "YouTube Channel";

    channelDescription.textContent =
      snippet.description || "No description available.";

    // CHANNEL IMAGE

    const avatar =
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url;

    if (avatar) {

      channelAvatar.innerHTML = "";

      const img = document.createElement("img");

      img.src = avatar;
      img.alt = snippet.title;

      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "50%";

      channelAvatar.appendChild(img);
    }

    // CHANNEL STATISTICS

    subscriberCount.textContent =
      stats.hiddenSubscriberCount
        ? "Hidden"
        : formatNumber(stats.subscriberCount);

    totalViews.textContent =
      formatNumber(stats.viewCount);

    totalVideos.textContent =
      formatNumber(stats.videoCount);

    // VISIT CHANNEL

    visitChannelBtn.href =
      "https://www.youtube.com/channel/" + channelId;

    // LATEST VIDEOS

    await loadLatestVideos(
      channel.contentDetails.relatedPlaylists.uploads
    );

    // SAVE CHANNEL ID

    localStorage.setItem("lastChannelId", channelId);

  } catch (error) {

    alert(error.message);

    console.error(error);

    channelName.textContent = "Channel Not Loaded";
    channelHandle.textContent = "--";
    channelDescription.textContent = error.message;

    subscriberCount.textContent = "--";
    totalViews.textContent = "--";
    totalVideos.textContent = "--";

  }

}


// =====================================
// LATEST VIDEOS
// =====================================

async function loadLatestVideos(playlistId) {

  latestVideos.innerHTML =
    '<div class="empty-state">Loading videos...</div>';

  try {

    const playlist = await youtubeRequest(
      "playlistItems",
      {
        part: "snippet",
        playlistId: playlistId,
        maxResults: 5
      }
    );

    latestVideos.innerHTML = "";

    if (!playlist.items?.length) {

      latestVideos.textContent = "No videos found.";
      return;

    }

    playlist.items.forEach(item => {

      const video = item.snippet;

      const videoId = video.resourceId.videoId;

      const box = document.createElement("div");

      box.style.display = "flex";
      box.style.gap = "12px";
      box.style.alignItems = "center";
      box.style.padding = "12px 0";
      box.style.borderBottom = "1px solid #29233e";

      const image = document.createElement("img");

      image.src =
        video.thumbnails?.medium?.url || "";

      image.style.width = "110px";
      image.style.height = "65px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "8px";

      const details = document.createElement("div");

      const title = document.createElement("p");

      title.textContent = video.title;

      title.style.fontSize = "12px";
      title.style.fontWeight = "600";

      const link = document.createElement("a");

      link.href =
        "https://www.youtube.com/watch?v=" + videoId;

      link.target = "_blank";
      link.textContent = "Watch Video ↗";

      link.style.color = "#bb79ff";
      link.style.fontSize = "11px";
      link.style.display = "inline-block";
      link.style.marginTop = "7px";

      details.appendChild(title);
      details.appendChild(link);

      box.appendChild(image);
      box.appendChild(details);

      latestVideos.appendChild(box);

    });

  } catch (error) {

    latestVideos.textContent =
      "Unable to load latest videos.";

    console.error(error);

  }

}


// =====================================
// LOAD BUTTONS
// =====================================

loadChannelBtn.addEventListener("click", () => {

  loadChannel(channelInput.value);

});

sidebarLoadBtn.addEventListener("click", () => {

  channelInput.value = sidebarInput.value;

  loadChannel(sidebarInput.value);

});


// ENTER KEY SUPPORT

channelInput.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    loadChannel(channelInput.value);
  }

});

sidebarInput.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    loadChannel(sidebarInput.value);
  }

});


// =====================================
// OTHER BUTTONS
// =====================================

document.getElementById("connectGoogleBtn")
  .addEventListener("click", () => {

    alert(
      "Google OAuth connection will be added in the next development stage."
    );

  });


document.getElementById("exploreTipsBtn")
  .addEventListener("click", () => {

    alert(
      "Creator growth tips will be added soon!"
    );

  });


document.getElementById("viewAllVideos")
  .addEventListener("click", () => {

    alert(
      "More video features are coming soon!"
    );

  });


// =====================================
// RESTORE LAST CHANNEL
// =====================================

const savedChannelId =
  localStorage.getItem("lastChannelId");

if (savedChannelId) {

  channelInput.value =
    "https://www.youtube.com/channel/" + savedChannelId;

    }
