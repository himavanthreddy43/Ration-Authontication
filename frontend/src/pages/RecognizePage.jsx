import Webcam from 'react-webcam';
import axios from 'axios';
import { ScanFace, Check, XCircle, Search, ArrowRight, Loader2, PackageCheck, Package } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

export default function RecognizePage() {
    const [status, setStatus] = useState('idle'); // idle, scanning, success, failed
    const [familyDetails, setFamilyDetails] = useState(null);
    const webcamRef = useRef(null);

    const scanFace = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return alert('Failed to capture image');

        setStatus('scanning');

        try {
            const res = await axios.post('https://ration-authontication-1.onrender.com/api/recognize', { image: imageSrc });
            setFamilyDetails(res.data);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('failed');
        }
    };

    const markRationCollected = async () => {
        try {
            await axios.post(`https://ration-authontication-1.onrender.com/api/family/${familyDetails.family_id}/mark_ration`);
            setFamilyDetails(prev => ({ ...prev, already_received_this_month: true }));
            alert('Ration successfully marked for this month!');
        } catch (error) {
            console.error(error);
            alert('Failed to mark ration: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Scanner Side */}
                <div className="lg:col-span-5 flex flex-col space-y-6">
                    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-white/40 h-full flex flex-col">
                        <div className="mb-6">
                            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight flex items-center">
                                <ScanFace className="mr-3 text-blue-600" size={28} /> Face Scanner
                            </h2>
                            <p className="text-zinc-500 mt-2 font-medium">Align Face within the frame and scan to retrieve family ration details.</p>
                        </div>

                        <div className="relative rounded-3xl overflow-hidden bg-black aspect-[3/4] sm:aspect-square lg:aspect-[3/4] flex items-center justify-center border-4 border-white shadow-2xl group flex-1">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: 1280,
                                    height: 720,
                                    facingMode: "user"
                                }}
                                onUserMediaError={() => alert("Camera access denied or hardware error. Please check your browser permissions.")}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />

                            {/* Scanner Overlay UI */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className={`w-3/4 h-3/4 border-2 rounded-[2rem] transition-all duration-500 \${
                                    status === 'scanning' ? 'border-blue-400 scale-105 shadow-[0_0_40px_rgba(96,165,250,0.5)]' :
                                    status === 'success' ? 'border-emerald-400 bg-emerald-400/20' :
                                    status === 'failed' ? 'border-rose-400 bg-rose-400/20' :
                                    'border-white/50 border-dashed'
                                }`}></div>
                            </div>

                            {status === 'scanning' && (
                                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
                                    <div className="bg-white/90 backdrop-blur-sm px-8 py-4 rounded-2xl flex flex-col items-center space-y-3 text-blue-900 font-bold shadow-2xl transform hover:scale-105 transition-transform">
                                        <Loader2 className="animate-spin text-blue-600" size={32} />
                                        <span>Analyzing Face Biomtrics...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={scanFace}
                            disabled={status === 'scanning'}
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl flex items-center justify-center space-x-3 font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all transform hover:-translate-y-1 text-lg"
                        >
                            <ScanFace size={24} />
                            <span>{status === 'scanning' ? 'Processing...' : 'Scan Now'}</span>
                        </button>
                    </div>
                </div>

                {/* Results Side */}
                <div className="lg:col-span-7 flex flex-col h-full">
                    {status === 'idle' || status === 'scanning' ? (
                        <div className="bg-white/40 backdrop-blur-md rounded-3xl border-2 border-dashed border-zinc-200/70 h-full flex flex-col items-center justify-center p-12 text-center text-zinc-400 min-h-[500px] shadow-sm">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                <Search size={48} strokeWidth={1.5} className="text-zinc-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-600">Awaiting Scan</h3>
                            <p className="mt-3 text-zinc-500 max-w-sm font-medium leading-relaxed">Scan a family member's face to securely verify identity and view ration card details.</p>
                        </div>
                    ) : status === 'success' && familyDetails ? (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-500/10 border border-emerald-100/50 overflow-hidden h-full flex flex-col animate-in slide-in-from-right-8 duration-500">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 flex items-start space-x-5 relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/30">
                                    <Check size={36} strokeWidth={3} />
                                </div>
                                <div className="relative z-10 text-white pt-1">
                                    <h3 className="text-2xl font-black tracking-tight">Match Verified!</h3>
                                    <p className="text-emerald-50 mt-1 font-medium text-lg flex items-center">
                                        Recognized as <span className="underline decoration-white/50 underline-offset-4 ml-1.5 font-bold">{familyDetails.recognized_member}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 flex-1 bg-white/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                                        <p className="text-sm font-bold text-zinc-400 tracking-wider uppercase mb-1">Family Head</p>
                                        <p className="text-xl font-bold text-zinc-900">{familyDetails.head_name}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                                        <p className="text-sm font-bold text-zinc-400 tracking-wider uppercase mb-1">Ration Card No</p>
                                        <p className="text-xl font-mono font-bold text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-lg">{familyDetails.ration_card_number}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                                        <p className="text-sm font-bold text-zinc-400 tracking-wider uppercase mb-1">Family Size</p>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-2xl font-black text-zinc-900">{familyDetails.members_count}</p>
                                            <span className="text-zinc-500 font-medium">Members</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                                        <p className="text-sm font-bold text-zinc-400 tracking-wider uppercase mb-2">Monthly Status</p>
                                        <div>
                                            {familyDetails.already_received_this_month ? (
                                                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                    <XCircle size={16} className="mr-2" /> Already Collected
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    <Check size={16} className="mr-2" /> Eligible to Collect
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 bg-indigo-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden shadow-sm">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <div className="flex items-center">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm mr-5 z-10 text-indigo-600">
                                            <Package size={32} />
                                        </div>
                                        <div className="z-10">
                                            <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider mb-1">Monthly Ration Allocation</p>
                                            <p className="text-indigo-900 font-black text-3xl">{familyDetails.rice_quantity_kg} kg <span className="text-xl font-bold text-indigo-700">Rice</span></p>
                                            <p className="text-indigo-600/80 text-sm font-semibold mt-1">Calculated as {familyDetails.members_count} members × 6kg per member</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white/80 border-t border-zinc-100 mt-auto">
                                <button
                                    onClick={markRationCollected}
                                    disabled={familyDetails.already_received_this_month}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-2xl flex items-center justify-center space-x-3 font-bold hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none disabled:transform-none transition-all transform hover:-translate-y-1 text-lg"
                                >
                                    <PackageCheck size={28} />
                                    <span>{familyDetails.already_received_this_month ? 'Ration Collected for Month' : 'Mark Ration as Collected Now'}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-rose-50/80 backdrop-blur-md rounded-3xl border border-rose-200 h-full flex flex-col items-center justify-center p-12 text-center text-rose-500 min-h-[500px] animate-in slide-in-from-right-8 shadow-sm">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-rose-200 mb-6">
                                <XCircle size={48} strokeWidth={2} className="text-rose-500" />
                            </div>
                            <h3 className="text-2xl font-black text-rose-900">No Match Found</h3>
                            <p className="mt-3 text-lg text-rose-700 max-w-sm font-medium leading-relaxed">The scanned face did not match any registered family members. Please ensure lighting is good and try again.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-8 px-8 py-3 bg-white text-rose-600 font-bold rounded-xl border border-rose-200 hover:bg-rose-100 shadow-sm transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
