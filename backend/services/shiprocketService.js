let shiprocketToken = null;
let tokenExpiresAt = 0;

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in";

const getShiprocketToken = async (forceRefresh = false) => {
    // Existing token still valid
    if (
        !forceRefresh &&
        shiprocketToken &&
        Date.now() < tokenExpiresAt
    ) {
        return shiprocketToken;
    }

    const email = process.env.SHIPROCKET_API_EMAIL;
    const password = process.env.SHIPROCKET_API_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "Shiprocket API credentials are not configured"
        );
    }

    const response = await fetch(
        `${SHIPROCKET_BASE_URL}/v1/external/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.token) {
        console.error(
            "SHIPROCKET AUTH ERROR:",
            data
        );

        throw new Error(
            data.message ||
            "Shiprocket authentication failed"
        );
    }

    shiprocketToken = data.token;

    // Shiprocket token is valid for 10 days.
    // Refresh slightly earlier for safety.
    tokenExpiresAt =
        Date.now() +
        9 * 24 * 60 * 60 * 1000;

    return shiprocketToken;
};

const shiprocketRequest = async (
    endpoint,
    options = {},
    retry = true
) => {
    const token =
        await getShiprocketToken();

    const response = await fetch(
        `${SHIPROCKET_BASE_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        }
    );

    // Token expired/rejected → refresh once
    if (response.status === 401 && retry) {
        await getShiprocketToken(true);

        return shiprocketRequest(
            endpoint,
            options,
            false
        );
    }

    const data = await response.json();

    if (!response.ok) {
        console.error(
            "SHIPROCKET API ERROR:",
            data
        );

        throw new Error(
            data.message ||
            "Shiprocket API request failed"
        );
    }

    return data;
};


const checkShiprocketServiceability = async (
    pickupPincode,
    deliveryPincode,
    weight = 0.5,
    cod = 0
) => {
    const params = new URLSearchParams({
        pickup_postcode: String(pickupPincode),
        delivery_postcode: String(deliveryPincode),
        weight: String(weight),
        cod: String(cod)
    });

    return shiprocketRequest(
        `/v1/external/courier/serviceability/?${params.toString()}`,
        {
            method: "GET"
        }
    );
};
const createShiprocketOrder = async (orderData) => {
    return shiprocketRequest(
        "/v1/external/orders/create/adhoc",
        {
            method: "POST",
            body: JSON.stringify(orderData)
        }
    );
};

const assignShiprocketAwb = async (shipmentId) => {

    if (!shipmentId) {
        throw new Error("Shiprocket shipment ID is required");
    }

    return shiprocketRequest(
        "/v1/external/courier/assign/awb",
        {
            method: "POST",
            body: JSON.stringify({
                shipment_id: Number(shipmentId)
            })
        }
    );
};


const generateShiprocketPickup = async (shipmentId) => {

    if (!shipmentId) {
        throw new Error("Shiprocket shipment ID is required");
    }

    return shiprocketRequest(
        "/v1/external/courier/generate/pickup",
        {
            method: "POST",
            body: JSON.stringify({
                shipment_id: [Number(shipmentId)]
            })
        }
    );
};


const trackShiprocketAwb = async (awbCode) => {
    if (!awbCode) {
        throw new Error("AWB code is required");
    }

    return shiprocketRequest(
        `/v1/external/courier/track/awb/${encodeURIComponent(awbCode)}`,
        {
            method: "GET"
        }
    );
};

module.exports = {
    getShiprocketToken,
    shiprocketRequest,
    checkShiprocketServiceability,
    createShiprocketOrder,
    assignShiprocketAwb,
    generateShiprocketPickup,
    trackShiprocketAwb
};