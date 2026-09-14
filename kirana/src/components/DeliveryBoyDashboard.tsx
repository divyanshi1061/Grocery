"use client";

import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSocket } from "../lib/socket";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import DeliveryChat from "./DeliveryChat";
import { CheckCircle2, Loader, Package, ShieldCheck, Truck, IndianRupee, Wallet } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, Tooltip, Bar } from "recharts";
import { motion, AnimatePresence } from "motion/react";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

interface ILocation {
  latitude: number;
  longitude: number;
}

function DeliveryBoyDashboard() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<ILocation>();
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>({ latitude: 0, longitude: 0 });

  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [earningsData, setEarningsData] = useState<any>(null);

  const { userData } = useSelector((state: RootState) => state.user);

  // =========================
  // Fetch Assignments
  // =========================
  const fetchAssignments = useCallback(async () => {
    try {
      const result = await axios.get("/api/delivery/get-assignments");
      setAssignments(result.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, []);

  // =========================
  // Fetch Current Order
  // =========================
  const fetchCurrentOrder = useCallback(async () => {
    try {
      const result = await axios.get("/api/delivery/current-order");
      if (result.data.active) {
        const assignment = result.data.assignment;
        setActiveOrder(assignment);
        setDelivered(false);
        setShowOtpBox(false);
        setOtp("");
        setOtpError("");
        setUserLocation({
          latitude: assignment.order.address.latitude,
          longitude: assignment.order.address.longitude,
        });
      } else {
        setActiveOrder(null);
        setUserLocation(undefined);
      }
    } catch (error) {
      console.error("Error fetching current order:", error);
    }
  }, []);

  // =========================
  // Accept Assignment
  // =========================
  const handleAccept = async (id: string) => {
    try {
      await axios.get(`/api/delivery/assignment/${id}/accept-assignment`);
      await fetchCurrentOrder();
      await fetchAssignments();
    } catch (error: any) {
      console.error("Error accepting assignment:", error?.response?.data?.message ?? error);
    }
  };

  // =========================
  // Send OTP (top-level — was mistakenly inside geo useEffect)
  // =========================
  const sendOtp = async () => {
    setSendOtpLoading(true);
    setOtpError("");
    try {
      await axios.post("/api/delivery/otp/send", { orderId: activeOrder.order._id });
      setShowOtpBox(true);
    } catch (error: any) {
      setOtpError(error?.response?.data?.message ?? "Failed to send OTP. Try again.");
    } finally {
      setSendOtpLoading(false);
    }
  };

  // =========================
  // Verify OTP (top-level — was mistakenly inside geo useEffect)
  // =========================
  const verifyOtp = async () => {
    if (!otp.trim()) { setOtpError("Please enter the OTP"); return; }
    setVerifyOtpLoading(true);
    setOtpError("");
    try {
      await axios.post("/api/delivery/otp/verify", { orderId: activeOrder.order._id, otp });
      setDelivered(true);
      setShowOtpBox(false);
      // Give user time to see success, then reset dashboard
      setTimeout(() => {
        setActiveOrder(null);
        setDelivered(false);
        fetchAssignments();
      }, 3000);
    } catch (error: any) {
      setOtpError(error?.response?.data?.message ?? "Incorrect OTP. Please try again.");
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  // =========================
  // Fetch Earnings
  // =========================
  const fetchEarnings = useCallback(async () => {
    try {
      const result = await axios.get("/api/delivery/earnings");
      setEarningsData(result.data);
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  }, []);

  // =========================
  // Fetch Data on Load
  // =========================
  useEffect(() => {
    if (!userData?._id) return;
    fetchCurrentOrder();
    fetchAssignments();
    fetchEarnings();
  }, [userData?._id, fetchCurrentOrder, fetchAssignments, fetchEarnings]);

  // =========================
  // Socket: new-assignment + order-status-update
  // =========================
  useEffect(() => {
    const socket = getSocket();

    const handleNewAssignment = (deliveryAssignment: any) => {
      setAssignments((prev) => {
        const alreadyExists = prev.some((item) => item?._id === deliveryAssignment?._id);
        return alreadyExists ? prev : [...prev, deliveryAssignment];
      });
    };

    // If another delivery boy snatched an assignment, refresh our list
    const handleAssignmentTaken = () => fetchAssignments();

    socket.on("new-assignment", handleNewAssignment);
    socket.on("assignment-taken", handleAssignmentTaken);

    return () => {
      socket.off("new-assignment", handleNewAssignment);
      socket.off("assignment-taken", handleAssignmentTaken);
    };
  }, [fetchAssignments]);

  // =========================
  // Geolocation Watcher
  // =========================
  useEffect(() => {
    if (!userData?._id) return;
    const socket = getSocket();
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDeliveryBoyLocation({ latitude, longitude });
        socket.emit("update-location", { userId: userData._id, latitude, longitude });
      },
      (error) => {
        if (error.code === error.TIMEOUT) {
          console.warn("Geolocation: waiting for GPS fix…");
        } else if (error.code === error.PERMISSION_DENIED) {
          console.error("Geolocation permission denied.");
        } else {
          console.error(`Geolocation error (code ${error.code}): ${error.message}`);
        }
      },
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 30000 }
    );
    return () => { navigator.geolocation.clearWatch(watcher); };
  }, [userData?._id]);

  // =========================
  // Active Delivery UI
  // =========================
  if (activeOrder && userLocation) {
    return (
      <div className="p-4 pt-[120px] min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Truck size={20} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Active Delivery</h1>
              <p className="text-xs text-gray-400">Order #{activeOrder.order?._id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Delivery Address</p>
            <p className="text-sm text-gray-700">{activeOrder.order?.address?.fullAddress}</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeOrder.order?.address?.fullName} · {activeOrder.order?.address?.mobile}
            </p>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
          </div>

          {/* Chat */}
          {activeOrder.order?._id && userData?._id && (
            <DeliveryChat orderId={activeOrder.order._id} senderId={userData._id} role="delivery_boy" />
          )}

          {/* OTP / Delivery Completion Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <AnimatePresence mode="wait">

              {/* ✅ Delivery completed */}
              {delivered && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </div>
                  <p className="text-lg font-bold text-emerald-700">Delivery Completed!</p>
                  <p className="text-sm text-gray-400">Resetting dashboard…</p>
                </motion.div>
              )}

              {/* 📦 Mark as Delivered button */}
              {!delivered && !showOtpBox && !activeOrder.order.deliveryOtpVerification && (
                <motion.div key="send-otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={13} /> OTP Verification
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Click below to send the delivery OTP to the customer's email.
                  </p>
                  <button
                    id="mark-delivered-btn"
                    onClick={sendOtp}
                    disabled={sendOtpLoading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition active:scale-95"
                  >
                    {sendOtpLoading
                      ? <><Loader size={16} className="animate-spin" /> Sending OTP…</>
                      : <><Package size={16} /> Mark as Delivered</>}
                  </button>
                  {otpError && <p className="text-red-500 text-sm mt-3 text-center">{otpError}</p>}
                </motion.div>
              )}

              {/* 🔢 Enter OTP */}
              {!delivered && showOtpBox && (
                <motion.div
                  key="verify-otp"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Enter Delivery OTP
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Ask the customer for the OTP sent to their email.
                  </p>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="• • • •"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                    className="w-full text-center text-3xl font-bold tracking-[1rem] border-2 border-gray-200 focus:border-orange-400 rounded-xl py-4 outline-none transition mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowOtpBox(false); setOtp(""); setOtpError(""); }}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      id="verify-otp-btn"
                      onClick={verifyOtp}
                      disabled={verifyOtpLoading || otp.length !== 4}
                      className="flex-2 flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition active:scale-95"
                    >
                      {verifyOtpLoading
                        ? <><Loader size={16} className="animate-spin" /> Verifying…</>
                        : "Verify OTP"}
                    </button>
                  </div>
                  {otpError && (
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-red-500 text-sm mt-3 text-center"
                    >
                      {otpError}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* Already completed (from DB) */}
              {activeOrder.order.deliveryOtpVerification && !delivered && (
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold py-3">
                  <CheckCircle2 size={18} /> Delivery already verified
                </div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // Assignments UI
  // =========================
  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mt-[100px] mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Package size={20} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Delivery Assignments</h2>
        </div>

        <AnimatePresence>
          {assignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                  <Truck size={28} className="text-orange-400" />
                </div>
                <p className="font-semibold text-gray-700">No active assignments</p>
                <p className="text-sm text-gray-400 mt-1">New delivery requests will appear here instantly.</p>
              </div>

              {/* Earnings Section */}
              {earningsData && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Wallet size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Your Earnings</h2>
                      <p className="text-xs text-gray-400">Track your daily income and deliveries</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center justify-center">
                      <p className="text-sm text-emerald-600 font-semibold mb-1">Today's Income</p>
                      <p className="text-2xl font-black text-emerald-700 flex items-center">
                        <IndianRupee size={20} />
                        {earningsData.todayEarnings}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center">
                      <p className="text-sm text-blue-600 font-semibold mb-1">Deliveries Today</p>
                      <p className="text-2xl font-black text-blue-700 flex items-center gap-2">
                        <Package size={20} />
                        {earningsData.todayDeliveries}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Last 7 Days Performance</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={earningsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                        <Tooltip
                          cursor={{ fill: '#f9fafb' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="earnings" fill="#10b981" radius={[4, 4, 0, 0]} name="Earnings (₹)" barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            assignments.map((a) => {
              if (!a) return null;
              return (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
                      <p className="font-bold text-gray-800">#{a.order?._id?.slice(-8).toUpperCase()}</p>
                    </div>
                    <span className="text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full">
                      New Request
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{a.order?.address?.fullAddress}</p>
                  <div className="flex gap-3">
                    <button
                      id={`accept-btn-${a._id}`}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold transition active:scale-95"
                      onClick={() => handleAccept(a._id)}
                    >
                      Accept
                    </button>
                    <button
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold transition active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DeliveryBoyDashboard;