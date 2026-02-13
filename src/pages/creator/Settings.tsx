import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/integrations/supabase/hooks';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    Camera,
    User,
    Mail,
    Phone,
    Globe,
    Loader2,
    Save,
    AtSign,
    FileText,
    Link as LinkIcon,
    Instagram,
    Linkedin,
} from 'lucide-react';
import CreatorLayout from '@/components/layout/CreatorLayout';

// X (Twitter) icon
const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

export default function Settings() {
    const { user } = useAuth();
    const profileQuery = useProfile(user?.id || '');
    const updateProfile = useUpdateProfile();

    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        x: '',
        linkedin: '',
        website: '',
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profile = profileQuery.data?.data;

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatar_url || '');
            const links = (profile.social_links as Record<string, string>) || {};
            setSocialLinks({
                instagram: links.instagram || '',
                x: links.x || '',
                linkedin: links.linkedin || '',
                website: links.website || '',
            });
        }
    }, [profile]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2MB.');
            return;
        }

        setUploading(true);
        const ext = file.name.split('.').pop();
        const filePath = `avatars/${user.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            toast.error('Failed to upload image.');
            setUploading(false);
            return;
        }

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        setAvatarUrl(urlData.publicUrl);
        setUploading(false);
        toast.success('Photo uploaded!');
    };

    const handleSave = async () => {
        if (!user) return;

        if (!displayName.trim()) {
            toast.error('Display name cannot be empty.');
            return;
        }

        setSaving(true);

        // Trim empty social links
        const cleanedLinks: Record<string, string> = {};
        Object.entries(socialLinks).forEach(([key, val]) => {
            if (val.trim()) cleanedLinks[key] = val.trim();
        });

        const { error } = await updateProfile.mutateAsync({
            userId: user.id,
            updates: {
                display_name: displayName.trim(),
                bio: bio.trim(),
                phone: phone.trim() || null,
                avatar_url: avatarUrl || null,
                social_links: cleanedLinks,
            } as any,
        });

        if (error) {
            toast.error(error.message || 'Failed to save profile.');
        } else {
            toast.success('Profile saved!');
        }
        setSaving(false);
    };

    if (profileQuery.isLoading) {
        return (
            <CreatorLayout>
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
            </CreatorLayout>
        );
    }

    return (
        <CreatorLayout>
            <div className="max-w-2xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
                    <p className="text-slate-500 text-sm">Manage your profile and preferences</p>
                </div>

                <div className="space-y-8">
                    {/* Avatar Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-emerald-400" />
                            Profile Picture
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-10 h-10 text-slate-500" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    {uploading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    ) : (
                                        <Camera className="w-5 h-5 text-white" />
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-slate-300">Upload a profile photo</p>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG or WebP. Max 2MB.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 bg-white/[0.05] border-white/[0.1] text-slate-300 hover:bg-white/[0.1] hover:text-white text-xs"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Choose File'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Basic Info Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            Basic Info
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-sm">Display Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-sm">Username</Label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        value={profile?.handle || ''}
                                        disabled
                                        className="pl-10 h-11 bg-white/[0.03] border-white/[0.06] text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-slate-600">Username cannot be changed after sign-up</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-sm">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        value={profile?.email || ''}
                                        disabled
                                        className="pl-10 h-11 bg-white/[0.03] border-white/[0.06] text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bio Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            Bio / Description
                        </h2>
                        <div className="space-y-2">
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                                placeholder="Tell your audience about yourself..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none text-sm"
                            />
                            <p className="text-xs text-slate-500 text-right">{bio.length}/300</p>
                        </div>
                    </motion.div>

                    {/* Social Links Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-emerald-400" />
                            Social Links
                        </h2>
                        <div className="space-y-3">
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                                <Input
                                    placeholder="https://instagram.com/username"
                                    value={socialLinks.instagram}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                    className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                            </div>
                            <div className="relative">
                                <XIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <Input
                                    placeholder="https://x.com/username"
                                    value={socialLinks.x}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, x: e.target.value })}
                                    className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                            </div>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                <Input
                                    placeholder="https://linkedin.com/in/username"
                                    value={socialLinks.linkedin}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                    className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                            </div>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                                <Input
                                    placeholder="https://yourwebsite.com"
                                    value={socialLinks.website}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                    className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-emerald-400" />
                            Contact
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-sm">Email (public)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        value={profile?.email || ''}
                                        disabled
                                        className="pl-10 h-11 bg-white/[0.03] border-white/[0.06] text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-sm">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        placeholder="+91 98765 43210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Save button */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-end pb-10"
                    >
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200 rounded-xl"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Profile
                                </>
                            )}
                        </Button>
                    </motion.div>
                </div>
            </div>
        </CreatorLayout>
    );
}
