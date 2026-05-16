import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Users, Search, Edit2, Trash2, ChevronDown, ChevronUp, UserX, UserMinus, ShieldAlert, Check, X, Loader2, UserPlus, Camera, ImagePlus } from 'lucide-react';
import Webcam from 'react-webcam';
export default function FamiliesPage() {
    const [families, setFamilies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFamily, setExpandedFamily] = useState(null);
    
    const [editingFamily, setEditingFamily] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const [addingMemberTo, setAddingMemberTo] = useState(null);
    const [newMember, setNewMember] = useState({ name: '', gender: 'Male', age: '', relationship: 'Self' });
    const [newMemberImages, setNewMemberImages] = useState([]);
    const [isSubmittingMember, setIsSubmittingMember] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [editMemberForm, setEditMemberForm] = useState({});
    const [isSavingMember, setIsSavingMember] = useState(false);
    const [isAddingFace, setIsAddingFace] = useState(false);
    const [isSavingFace, setIsSavingFace] = useState(false);
    const memberWebcamRef = useRef(null);
    const webcamRef = useRef(null);

    const handleEditMemberClick = () => {
        setEditMemberForm({
            name: selectedMember.name,
            age: selectedMember.age,
            gender: selectedMember.gender,
            relationship: selectedMember.relationship
        });
        setIsEditingMember(true);
    };

    const handleSaveMemberDetails = async () => {
        setIsSavingMember(true);
        try {
            await axios.put(`http://localhost:5000/api/family_members/${selectedMember.member_id}`, editMemberForm);
            fetchFamilies();
            setSelectedMember({...selectedMember, ...editMemberForm});
            setIsEditingMember(false);
        } catch (error) {
            console.error("Failed to update member", error);
            alert("Failed to update member.");
        } finally {
            setIsSavingMember(false);
        }
    };

    const handleDeleteSelectedMember = async () => {
        if (!window.confirm("Are you sure you want to delete this member? Their face data will be permanently removed.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/family_members/${selectedMember.member_id}`);
            fetchFamilies();
            setSelectedMember(null);
            setIsEditingMember(false);
        } catch (error) {
            console.error("Failed to delete member", error);
            alert("Failed to delete member.");
        }
    };

    const handleDeleteFace = async (faceId) => {
        if (!faceId) {
            alert("Cannot delete this image right now. Please refresh the page.");
            return;
        }
        if (!window.confirm("Delete this face image?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/face/${faceId}`);
            const updatedImages = selectedMember.images.filter(img => img.face_id !== faceId);
            setSelectedMember({...selectedMember, images: updatedImages});
            fetchFamilies();
        } catch(err) {
            console.error("Failed to delete face", err);
            alert("Failed to delete face.");
        }
    };

    const handleCaptureNewFace = () => {
        const imageSrc = memberWebcamRef.current?.getScreenshot();
        if (imageSrc) {
            saveNewFace(imageSrc);
        }
    };

    const saveNewFace = async (imageSrc) => {
        setIsSavingFace(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/family_members/${selectedMember.member_id}/face`, { image: imageSrc });
            const newFace = res.data.face;
            setSelectedMember({...selectedMember, images: [...(selectedMember.images || []), newFace]});
            fetchFamilies();
            setIsAddingFace(false);
        } catch(err) {
            console.error("Failed to add new face", err);
            alert(err.response?.data?.error || "Failed to add new face.");
        } finally {
            setIsSavingFace(false);
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setNewMemberImages(prev => [...prev, imageSrc]);
        }
    }, [webcamRef]);

    const removeImage = (index) => {
        setNewMemberImages(prev => prev.filter((_, i) => i !== index));
    };

    const submitNewMember = async (familyId) => {
        if (!newMember.name || !newMember.age || newMemberImages.length === 0) return;
        setIsSubmittingMember(true);
        try {
            const payload = {
                ...newMember,
                images: newMemberImages
            };
            const res = await axios.post(`http://localhost:5000/api/family/${familyId}/member`, payload);
            
            // Update local state
            setFamilies(families.map(f => {
                if (f.family_id === familyId) {
                    return { 
                        ...f, 
                        members: [...f.members, res.data.member] 
                    };
                }
                return f;
            }));
            
            // Reset state
            setAddingMemberTo(null);
            setNewMember({ name: '', gender: 'Male', age: '', relationship: 'Self' });
            setNewMemberImages([]);
            alert("Member added successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to add member: " + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmittingMember(false);
        }
    };

    const fetchFamilies = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/families');
            setFamilies(res.data);
        } catch (error) {
            console.error("Failed to fetch families", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFamilies();
    }, []);

    useEffect(() => {
        if (selectedMember) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedMember]);

    const handleDeleteFamily = async (familyId) => {
        if (!window.confirm("Are you sure you want to permanently delete this family and all associated data (faces, members, ration history)?")) return;
        
        try {
            await axios.delete(`http://localhost:5000/api/families/${familyId}`);
            setFamilies(families.filter(f => f.family_id !== familyId));
            if (expandedFamily === familyId) setExpandedFamily(null);
        } catch (error) {
            alert("Failed to delete family");
            console.error(error);
        }
    };

    const handleDeleteMember = async (memberId, familyId) => {
        if (!window.confirm("Are you sure you want to delete this member? Their face data will be permanently removed.")) return;
        
        try {
            await axios.delete(`http://localhost:5000/api/family_members/${memberId}`);
            // Update local state
            setFamilies(families.map(f => {
                if (f.family_id === familyId) {
                    return { ...f, members: f.members.filter(m => m.member_id !== memberId) };
                }
                return f;
            }));
        } catch (error) {
            alert("Failed to delete member");
            console.error(error);
        }
    };

    const startEditing = (family) => {
        setEditingFamily(family.family_id);
        setEditForm({
            head_name: family.head_name,
            ration_card_number: family.ration_card_number,
            village_name: family.village_name || '',
            phone_number: family.phone_number || '',
            address: family.address || ''
        });
    };

    const saveEdit = async () => {
        setIsSaving(true);
        try {
            await axios.put(`http://localhost:5000/api/families/${editingFamily}`, editForm);
            setFamilies(families.map(f => f.family_id === editingFamily ? { ...f, ...editForm } : f));
            setEditingFamily(null);
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update family");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredFamilies = families.filter(f => 
        f.head_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.ration_card_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-6 mt-4 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-600 tracking-tight flex items-center">
                        <Users className="mr-3 text-blue-600" size={28} /> Family Directory
                    </h2>
                    <p className="text-zinc-500 mt-1 font-medium">Manage registered families, edit details, and view members.</p>
                </div>
                
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or RC number..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/20 shadow-lg shadow-zinc-200/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-zinc-500 font-medium">Loading directory...</p>
                </div>
            ) : filteredFamilies.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                        <UserX className="w-10 h-10 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-800 mb-1">No Families Found</h3>
                    <p className="text-zinc-500">There are no families matching your search criteria.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredFamilies.map((family) => (
                        <div key={family.family_id} className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg shadow-zinc-200/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl group">
                            
                            {/* Family Header Row */}
                            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className={`flex-1 grid grid-cols-1 gap-4 ${editingFamily === family.family_id ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                                    {editingFamily === family.family_id ? (
                                        <>
                                            <div>
                                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Head of Family</label>
                                                <input type="text" value={editForm.head_name} onChange={e => setEditForm({...editForm, head_name: e.target.value})} className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Ration Card</label>
                                                <input type="text" value={editForm.ration_card_number} onChange={e => setEditForm({...editForm, ration_card_number: e.target.value})} className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Mobile Number</label>
                                                <input type="text" value={editForm.phone_number} onChange={e => setEditForm({...editForm, phone_number: e.target.value})} className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" placeholder="Phone Number" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Village/Area</label>
                                                <input type="text" value={editForm.village_name} onChange={e => setEditForm({...editForm, village_name: e.target.value})} className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Head of Family</p>
                                                <p className="font-bold text-zinc-900 text-lg">{family.head_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Ration Card</p>
                                                <p className="font-semibold text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded-md border border-blue-100">{family.ration_card_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Members</p>
                                                <p className="font-medium text-zinc-700">{family.members.length} Registered</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2 border-t md:border-t-0 pt-4 md:pt-0">
                                    {editingFamily === family.family_id ? (
                                        <>
                                            <button onClick={saveEdit} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center">
                                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                                <span className="ml-1 text-sm font-bold">Save</span>
                                            </button>
                                            <button onClick={() => setEditingFamily(null)} className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 p-2 rounded-lg transition-colors flex items-center">
                                                <X size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setExpandedFamily(expandedFamily === family.family_id ? null : family.family_id)} className="flex items-center space-x-1 px-3 py-2 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
                                                <span>{expandedFamily === family.family_id ? 'Hide' : 'View'} Details</span>
                                                {expandedFamily === family.family_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            <button onClick={() => startEditing(family)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteFamily(family.family_id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details Section */}
                            {expandedFamily === family.family_id && (
                                <div className="border-t border-zinc-200/50 bg-zinc-50/50 p-5 animate-in slide-in-from-top-2 duration-300">
                                    {editingFamily === family.family_id && (
                                        <div className="grid grid-cols-1 gap-4 mb-6 pb-6 border-b border-zinc-200">
                                            <div>
                                                <label className="text-xs font-bold text-zinc-500 mb-1 block">Full Address</label>
                                                <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                                            </div>
                                        </div>
                                    )}

                                    {!editingFamily && (family.phone_number || family.address || family.village_name) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-zinc-200/80">
                                            {family.village_name && (
                                                <div><span className="text-xs text-zinc-500 font-bold block">Location</span><span className="text-sm font-medium text-zinc-800">{family.village_name}</span></div>
                                            )}
                                            {family.phone_number && (
                                                <div><span className="text-xs text-zinc-500 font-bold block">Contact</span><span className="text-sm font-medium text-zinc-800">{family.phone_number}</span></div>
                                            )}
                                            {family.address && (
                                                <div className="sm:col-span-1"><span className="text-xs text-zinc-500 font-bold block">Address</span><span className="text-sm font-medium text-zinc-800">{family.address}</span></div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-zinc-800 flex items-center"><Users size={16} className="mr-2 text-indigo-500" /> Registered Members</h4>
                                        {addingMemberTo !== family.family_id && (
                                            <button 
                                                onClick={() => setAddingMemberTo(family.family_id)} 
                                                className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 flex items-center transition-colors"
                                            >
                                                <UserPlus size={14} className="mr-1" /> Add Member
                                            </button>
                                        )}
                                    </div>
                                    
                                    {addingMemberTo === family.family_id && (
                                        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm mb-4 animate-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center mb-4">
                                                <h5 className="font-bold text-blue-800">Add New Member</h5>
                                                <button onClick={() => setAddingMemberTo(null)} className="text-zinc-400 hover:text-zinc-700">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                <div className="col-span-2 md:col-span-2">
                                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Name</label>
                                                    <input type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none text-sm" placeholder="Member Name" />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Age</label>
                                                    <input type="number" value={newMember.age} onChange={e => setNewMember({...newMember, age: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none text-sm" placeholder="Age" />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Gender</label>
                                                    <select value={newMember.gender} onChange={e => setNewMember({...newMember, gender: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none text-sm">
                                                        <option>Male</option><option>Female</option><option>Other</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2 md:col-span-4">
                                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Relationship to Head</label>
                                                    <select value={newMember.relationship} onChange={e => setNewMember({...newMember, relationship: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none text-sm">
                                                        <option>Self</option><option>Spouse</option><option>Child</option><option>Parent</option><option>Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="block text-xs font-bold text-zinc-500 mb-2">Capture Faces (Take 2-3 angles)</label>
                                                <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center max-h-48 group">
                                                    <Webcam
                                                        audio={false}
                                                        ref={webcamRef}
                                                        screenshotFormat="image/jpeg"
                                                        videoConstraints={{ facingMode: "user" }}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={capture} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-1.5 rounded-full flex items-center space-x-1 text-sm font-medium">
                                                            <Camera size={14} /><span>Snap</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {newMemberImages.length > 0 && (
                                                    <div className="flex space-x-2 overflow-x-auto py-2 mt-2">
                                                        {newMemberImages.map((img, i) => (
                                                            <div key={i} className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-blue-500 group">
                                                                <img src={img} alt={`capture-${i}`} className="w-full h-full object-cover" />
                                                                <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500/80 text-white p-0.5 opacity-0 group-hover:opacity-100"><X size={10} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button 
                                                onClick={() => submitNewMember(family.family_id)} 
                                                disabled={!newMember.name || !newMember.age || newMemberImages.length === 0 || isSubmittingMember}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                                            >
                                                {isSubmittingMember ? <Loader2 size={16} className="animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
                                                {isSubmittingMember ? 'Adding...' : 'Save Member'}
                                            </button>
                                        </div>
                                    )}

                                    {family.members.length === 0 ? (
                                        <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-start text-sm">
                                            <ShieldAlert size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                                            This family has no registered members.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {family.members.map(member => (
                                                <div key={member.member_id} onClick={() => setSelectedMember(member)} className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center justify-between hover:border-blue-300 hover:shadow-md cursor-pointer transition-all shadow-sm group">
                                                    <div>
                                                        <p className="font-bold text-zinc-800 text-sm group-hover:text-blue-700 transition-colors">{member.name}</p>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{member.relationship} • {member.age} yrs • {member.gender}</p>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.member_id, family.family_id); }}
                                                        className="text-zinc-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors"
                                                        title="Remove Member"
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Member Details Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedMember(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50 shrink-0">
                            {isEditingMember ? (
                                <div className="flex-1 mr-4 space-y-3">
                                    <input type="text" value={editMemberForm.name} onChange={e => setEditMemberForm({...editMemberForm, name: e.target.value})} className="w-full px-3 py-2 border border-blue-300 rounded-lg outline-none text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-blue-500" placeholder="Name" />
                                    <div className="flex gap-2">
                                        <select value={editMemberForm.relationship} onChange={e => setEditMemberForm({...editMemberForm, relationship: e.target.value})} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-md outline-none text-sm text-zinc-600">
                                            <option>Self</option><option>Spouse</option><option>Child</option><option>Parent</option><option>Other</option>
                                        </select>
                                        <input type="number" value={editMemberForm.age} onChange={e => setEditMemberForm({...editMemberForm, age: e.target.value})} className="w-20 px-3 py-1.5 border border-zinc-300 rounded-md outline-none text-sm text-zinc-600" placeholder="Age" />
                                        <select value={editMemberForm.gender} onChange={e => setEditMemberForm({...editMemberForm, gender: e.target.value})} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-md outline-none text-sm text-zinc-600">
                                            <option>Male</option><option>Female</option><option>Other</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleSaveMemberDetails} disabled={isSavingMember} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center">
                                            {isSavingMember ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Check size={16} className="mr-1.5" />} Save
                                        </button>
                                        <button onClick={() => setIsEditingMember(false)} className="px-4 py-1.5 bg-zinc-200 text-zinc-700 text-sm font-bold rounded-lg hover:bg-zinc-300">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900">{selectedMember.name}</h3>
                                    <p className="text-sm text-zinc-500 font-medium">{selectedMember.relationship} • {selectedMember.age} yrs • {selectedMember.gender}</p>
                                </div>
                            )}
                            <div className="flex items-start gap-1">
                                {!isEditingMember && (
                                    <>
                                        <button onClick={handleEditMemberClick} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Edit Member">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={handleDeleteSelectedMember} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Delete Member">
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => {setSelectedMember(null); setIsEditingMember(false);}} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-zinc-800 flex items-center">
                                    <Camera size={18} className="mr-2 text-blue-500" /> 
                                    Registered Face Images ({selectedMember.images?.length || 0})
                                </h4>
                                {!isAddingFace && (
                                    <button onClick={() => setIsAddingFace(true)} className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center transition-colors">
                                        <ImagePlus size={16} className="mr-1.5" /> Add Image
                                    </button>
                                )}
                            </div>

                            {isAddingFace && (
                                <div className="mb-6 bg-zinc-900 rounded-2xl overflow-hidden relative shadow-lg">
                                    <Webcam audio={false} ref={memberWebcamRef} screenshotFormat="image/jpeg" className="w-full" />
                                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                                        <button onClick={() => setIsAddingFace(false)} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm transition-colors">Cancel</button>
                                        <button onClick={handleCaptureNewFace} disabled={isSavingFace} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center shadow-lg transition-colors disabled:opacity-50">
                                            {isSavingFace ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Camera size={16} className="mr-1.5" />} Capture & Save
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(!selectedMember.images || selectedMember.images.length === 0) ? (
                                <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
                                    <UserX size={32} className="mx-auto text-zinc-300 mb-2" />
                                    <p className="text-zinc-500 font-medium">No images found for this member.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedMember.images.map((img, i) => (
                                        <div key={img.face_id || i} className="aspect-square rounded-2xl overflow-hidden border border-zinc-200 shadow-sm relative group">
                                            <img src={img.url || img} alt={`face-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => handleDeleteFace(img.face_id)} className="bg-rose-600 text-white p-3 rounded-full hover:bg-rose-500 hover:scale-110 transition-all shadow-lg" title="Delete Image">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
