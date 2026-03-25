const fetchBanners = async () => {
  const url = "https://api.anushatechnologies.com/api/customer/banners";
  console.log(`Fetching from: ${url}`);
  try {
    const resp = await fetch(url);
    console.log(`Status: ${resp.status}`);
    const json = await resp.json();
    console.log("JSON Response:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
};

fetchBanners();
