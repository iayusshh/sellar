import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyEmail() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
            <div className="absolute inset-0">
                <motion.div
                    className="absolute top-[-10%] left-[15%] w-[400px] h-[400px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, hsl(160 84% 39%) 0%, transparent 70%)' }}
                    animate={{ x: [0, 25, 0], y: [0, 30, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[0%] w-[450px] h-[450px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, hsl(220 70% 50%) 0%, transparent 70%)' }}
                    animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
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
                        <CardTitle className="text-2xl font-bold text-white">Check your email</CardTitle>
                        <CardDescription className="text-slate-400">
                            We've sent you a verification link
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-center space-y-6">
                            {/* Animated mail icon */}
                            <motion.div
                                className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <motion.div
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                >
                                    <Mail className="w-10 h-10 text-emerald-400" />
                                </motion.div>
                            </motion.div>

                            <div className="space-y-2">
                                <p className="text-sm text-slate-300">
                                    Click the link in the email to verify your account and start selling.
                                </p>
                                <p className="text-xs text-slate-500">
                                    Didn't get the email? Check your spam folder or try signing up again.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    asChild
                                    className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200"
                                >
                                    <Link to="/auth/signin">
                                        Go to Sign In
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full h-11 bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1] hover:text-white"
                                >
                                    <Link to="/auth/signup">
                                        Try a different email
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
