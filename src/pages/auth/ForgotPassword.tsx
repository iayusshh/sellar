import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!email) {
            toast.error('Please enter your email');
            setLoading(false);
            return;
        }

        const { error } = await resetPassword(email);

        if (error) {
            toast.error(error.message || 'Failed to send reset link');
            setLoading(false);
            return;
        }

        setSent(true);
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
            <div className="absolute inset-0">
                <motion.div
                    className="absolute top-[-10%] left-[10%] w-[450px] h-[450px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, hsl(160 84% 39%) 0%, transparent 70%)' }}
                    animate={{ x: [0, 30, 0], y: [0, 25, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, hsl(220 70% 50%) 0%, transparent 70%)' }}
                    animate={{ x: [0, -25, 0], y: [0, -35, 0] }}
                    transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <motion.div
                className="w-full max-w-md relative z-10"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-display font-bold text-white">Sellar</span>
                </Link>

                <Card className="bg-white/[0.06] backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/40">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-bold text-white">
                            {sent ? 'Check your email' : 'Forgot password?'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {sent
                                ? `We've sent a reset link to ${email}`
                                : "No worries, we'll send you a reset link"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {sent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-center space-y-6"
                            >
                                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                </div>
                                <p className="text-sm text-slate-400">
                                    Open the link in the email to reset your password. If you don't see it, check your spam folder.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full h-11 bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1] hover:text-white"
                                    onClick={() => { setSent(false); setEmail(''); }}
                                >
                                    Try a different email
                                </Button>
                                <Link
                                    to="/auth/signin"
                                    className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to sign in
                                </Link>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            required
                                            className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending link...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>

                                <Link
                                    to="/auth/signin"
                                    className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to sign in
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
