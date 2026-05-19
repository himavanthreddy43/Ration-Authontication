import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, UserPlus, CheckCircle2, User, HelpCircle, X, Loader2, ImagePlus } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [familyData, setFamilyData] = useState({
        head_name: '',
        ration_card_number: '',
        village_name: '',
        phone_number: '',
        address: '',
        members: []
    });

    // Member form state
    const [currentMember, setCurrentMember] = useState({
        name: '',
        gender: 'Male',
        age: '',
        relationship: 'Self'
    });
    const [capturedImages, setCapturedImages] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const webcamRef = useRef(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setCapturedImages(prev => [...prev, imageSrc]);
        }
    }, [webcamRef]);

    const removeImage = (index) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const addMember = () => {
        if (currentMember.name && currentMember.age && capturedImages.length > 0) {
            setFamilyData(prev => ({
                ...prev,
                members: [...prev.members, {
                    ...currentMember,
                    images: capturedImages
                }]
            }));
            // Reset member form
            setCurrentMember({
                name: '',
                gender: 'Male',
                age: '',
                relationship: 'Self'
            });
            setCapturedImages([]);
        }
    };

    const submitFamily = async () => {
        try {
            setIsSubmitting(true);
            await axios.post('https://ration-authontication-1.onrender.com/api/family/register', familyData);
            alert('Family Registered Successfully!');
            setStep(1);
            setFamilyData({
                head_name: '', ration_card_number: '',
                village_name: '', phone_number: '', address: '',
                members: []
            });
        } catch (error) {
            console.error(error);
            alert('Failed to register family. ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 mt-4">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden transition-all">

                {/* Header */}
                <div className="border-b border-zinc-200/50 bg-white/50 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Register New Family</h2>
                        <p className="text-zinc-500 mt-1">Add details and capture multiple faces for enhanced recognition.</p>
                    </div>
                    <div className="flex space-x-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${step === 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-blue-100 text-blue-600'}`}>1</span>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${step === 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-zinc-100 text-zinc-400'}`}>2</span>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-8">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Head of Family Name</label>
                                    <input
                                        type="text"
                                        value={familyData.head_name}
                                        onChange={e => setFamilyData({ ...familyData, head_name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="E.g. Ramesh Kumar"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Ration Card Number</label>
                                    <input
                                        type="text"
                                        value={familyData.ration_card_number}
                                        onChange={e => setFamilyData({ ...familyData, ration_card_number: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="E.g. RC-0987-6543-21"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Village/Area Name</label>
                                    <input
                                        type="text"
                                        value={familyData.village_name}
                                        onChange={e => setFamilyData({ ...familyData, village_name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="E.g. Greenfield Village"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={familyData.phone_number}
                                        onChange={e => setFamilyData({ ...familyData, phone_number: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="E.g. 9876543210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Full Address</label>
                                    <textarea
                                        value={familyData.address}
                                        onChange={e => setFamilyData({ ...familyData, address: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
                                        placeholder="Enter complete residential address"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 mt-4">
                                <button
                                    onClick={() => { if (familyData.head_name && familyData.ration_card_number) setStep(2) }}
                                    disabled={!familyData.head_name || !familyData.ration_card_number}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                                >
                                    Proceed to Add Members
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Member Add Form */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Member Name</label>
                                        <input
                                            type="text"
                                            value={currentMember.name}
                                            onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="E.g. Anita Kumar"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Relationship</label>
                                        <select
                                            value={currentMember.relationship}
                                            onChange={e => setCurrentMember({ ...currentMember, relationship: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        >
                                            <option>Self</option>
                                            <option>Spouse</option>
                                            <option>Child</option>
                                            <option>Parent</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Age</label>
                                        <input
                                            type="number"
                                            value={currentMember.age}
                                            onChange={e => setCurrentMember({ ...currentMember, age: parseInt(e.target.value) || '' })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="Years"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Gender</label>
                                        <select
                                            value={currentMember.gender}
                                            onChange={e => setCurrentMember({ ...currentMember, gender: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        >
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-zinc-700">Capture Faces (Take 2-3 angles)</label>
                                    <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center shadow-inner group">
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
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={capture}
                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-2 rounded-full flex items-center space-x-2 font-medium transition-all"
                                            >
                                                <Camera size={18} />
                                                <span>Snap Photo</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Thumbnail gallery */}
                                    {capturedImages.length > 0 && (
                                        <div className="flex space-x-3 overflow-x-auto py-2">
                                            {capturedImages.map((img, i) => (
                                                <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-500 group">
                                                    <img src={img} alt={`capture-${i}`} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeImage(i)}
                                                        className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {capturedImages.length < 5 && (
                                                <button onClick={capture} className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-zinc-300 text-zinc-400 hover:border-blue-400 hover:text-blue-500 flex flex-col items-center justify-center transition-colors">
                                                    <ImagePlus size={20} />
                                                    <span className="text-xs mt-1 font-medium">Add More</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={addMember}
                                    disabled={!currentMember.name || !currentMember.age || capturedImages.length === 0}
                                    className="w-full bg-emerald-500 text-white py-3.5 rounded-xl flex items-center justify-center space-x-2 font-medium hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <UserPlus size={20} />
                                    <span>Add Member to Family</span>
                                </button>
                            </div>

                            {/* Members List Side Panel */}
                            <div className="lg:col-span-2 bg-gradient-to-b from-zinc-50 to-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col h-full">
                                <h3 className="font-bold text-zinc-900 flex items-center space-x-2 mb-4 pb-4 border-b border-zinc-200/60">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <User size={18} />
                                    </div>
                                    <span>Added Members ({familyData.members.length})</span>
                                </h3>

                                <div className="flex-1 overflow-y-auto space-y-3 mb-6 min-h-[300px]">
                                    {familyData.members.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                                                <HelpCircle size={28} className="text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-medium">No members added</p>
                                            <p className="text-xs mt-1 text-center px-4">Register members to complete the family setup.</p>
                                        </div>
                                    ) : (
                                        familyData.members.map((m, i) => (
                                            <div key={i} className="flex items-start space-x-3 bg-white p-3.5 rounded-xl border border-zinc-200/70 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="relative">
                                                    <img src={m.images[0]} className="w-12 h-12 rounded-lg object-cover border border-zinc-100" />
                                                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                                        {m.images.length}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-zinc-800 leading-tight">{m.name}</div>
                                                    <div className="text-xs text-zinc-500 mt-0.5">{m.relationship} • {m.age} yrs</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-zinc-200 mt-auto">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full bg-white border border-zinc-200 text-zinc-600 py-3 rounded-xl font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                                    >
                                        Back to Details
                                    </button>
                                    <button
                                        onClick={submitFamily}
                                        disabled={familyData.members.length === 0 || isSubmitting}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl flex items-center justify-center space-x-2 font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all"
                                    >
                                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                        <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
