import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signInWithEmailAndPassword, signUpWithEmailAndPassword, sendPasswordResetEmail } from '../../services/authService';

import Button from '../Button';
import BirdIcon from '../icons/BirdIcon';
import GoogleIcon from '../icons/GoogleIcon';
import GithubIcon from '../icons/GithubIcon';
import MailIcon from '../icons/MailIcon';
import LockClosedIcon from '../icons/LockClosedIcon';
import UserIcon from '../icons/UserIcon';
import EyeIcon from '../icons/EyeIcon';
import EyeOffIcon from '../icons/EyeOffIcon';


const InputWithIcon: React.FC<{
    icon: React.ReactNode;
    type: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    autoComplete?: string;
    required?: boolean;
}> = ({ icon, type, name, value, onChange, placeholder, autoComplete, required }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;

    return (
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                {icon}
            </span>
            <input
                type={inputType}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required={required}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                >
                    {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
            )}
        </div>
    );
};

const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
    const getStrength = () => {
        let score = 0;
        if (password.length > 7) score++;
        if (password.length > 11) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };
    const strength = getStrength();
    const levels = [
        { width: '0%', color: '', text: '' },
        { width: '20%', color: 'bg-red-500', text: 'Very Weak' },
        { width: '40%', color: 'bg-orange-500', text: 'Weak' },
        { width: '60%', color: 'bg-yellow-500', text: 'Fair' },
        { width: '80%', color: 'bg-lime-500', text: 'Good' },
        { width: '100%', color: 'bg-green-500', text: 'Strong' },
    ];
    const currentLevel = levels[strength];

    return (
        <div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${currentLevel.color}`} style={{ width: currentLevel.width }}></div>
            </div>
            <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400 font-mono">{currentLevel.text}</p>
        </div>
    );
};


const Login: React.FC = () => {
    const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>('login');
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', agreedToTerms: false });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<null | 'google' | 'github'>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setError('');
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSocialSignIn = async (provider: 'google' | 'github') => {
        setSocialLoading(provider);
        setError('');
        try {
            if (provider === 'google') {
                await signInWithGoogle();
                // onAuthStateChanged in App.tsx will handle navigation
            } else {
                // Placeholder for GitHub sign-in
                alert("GitHub sign-in is not yet implemented.");
                setSocialLoading(null);
            }
        } catch (err) {
            console.error("Sign in failed:", err);
            setError("Failed to sign in. Please try again.");
            setSocialLoading(null);
        }
    };
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(form.email, form.password);
        } catch (err: any) {
            setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password.' : 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (!form.agreedToTerms) {
            setError("You must agree to the terms and conditions.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signUpWithEmailAndPassword(form.name, form.email, form.password);
        } catch (err: any) {
             setError(err.code === 'auth/email-already-in-use' ? 'This email is already registered.' : 'An error occurred. Please try again.');
            setLoading(false);
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(form.email);
            setMessage('Password reset email sent! Check your inbox.');
        } catch (err: any) {
            setError(err.code === 'auth/user-not-found' ? 'No account found with this email.' : 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans">
            <div className="max-w-md w-full bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-2xl p-8 animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <BirdIcon className="h-16 w-16 text-blue-500" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white font-sans">Welcome to Mavericks</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {view === 'login' && 'Sign in to continue your journey.'}
                        {view === 'signup' && 'Create your account to get started.'}
                        {view === 'forgotPassword' && 'Reset your password.'}
                    </p>
                </div>
                
                {/* View: Login */}
                {view === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <InputWithIcon icon={<MailIcon className="h-5 w-5" />} type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="Email" autoComplete="email" required />
                        <InputWithIcon icon={<LockClosedIcon className="h-5 w-5" />} type="password" name="password" value={form.password} onChange={handleInputChange} placeholder="Password" autoComplete="current-password" required />
                        <div className="text-right text-sm">
                            <button type="button" onClick={() => setView('forgotPassword')} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</button>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button type="submit" disabled={loading} size="lg" className="w-full">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                )}
                
                {/* View: Signup */}
                {view === 'signup' && (
                    <form onSubmit={handleSignup} className="space-y-4">
                        <InputWithIcon icon={<UserIcon className="h-5 w-5" />} type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="Full Name" autoComplete="name" required />
                        <InputWithIcon icon={<MailIcon className="h-5 w-5" />} type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="Email" autoComplete="email" required />
                        <InputWithIcon icon={<LockClosedIcon className="h-5 w-5" />} type="password" name="password" value={form.password} onChange={handleInputChange} placeholder="Password" autoComplete="new-password" required />
                        {form.password && <PasswordStrengthMeter password={form.password} />}
                        <InputWithIcon icon={<LockClosedIcon className="h-5 w-5" />} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleInputChange} placeholder="Confirm Password" autoComplete="new-password" required />
                        <div className="flex items-center">
                            <input id="terms" name="agreedToTerms" type="checkbox" checked={form.agreedToTerms} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-blue-600 focus:ring-blue-500"/>
                            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">I agree to the <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Terms and Conditions</a></label>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button type="submit" disabled={loading} size="lg" className="w-full">
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                    </form>
                )}
                
                {/* View: Forgot Password */}
                {view === 'forgotPassword' && (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <InputWithIcon icon={<MailIcon className="h-5 w-5" />} type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="Enter your email" autoComplete="email" required />
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                        <Button type="submit" disabled={loading} size="lg" className="w-full">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>
                )}
                
                {/* Social Logins & View Toggler */}
                {view !== 'forgotPassword' && (
                    <>
                        <div className="my-6 flex items-center">
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">OR</span>
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <Button onClick={() => handleSocialSignIn('google')} variant="secondary" disabled={!!socialLoading}>
                                {socialLoading === 'google' ? '...' : <><GoogleIcon className="h-5 w-5 mr-2"/> Google</>}
                            </Button>
                            <Button onClick={() => handleSocialSignIn('github')} variant="secondary" disabled={!!socialLoading}>
                                {socialLoading === 'github' ? '...' : <><GithubIcon className="h-5 w-5 mr-2"/> GitHub</>}
                            </Button>
                        </div>
                    </>
                )}
                
                <div className="mt-6 text-center text-sm">
                    {view === 'login' && <p className="text-gray-600 dark:text-gray-300">Don't have an account? <button onClick={() => setView('signup')} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Sign Up</button></p>}
                    {view === 'signup' && <p className="text-gray-600 dark:text-gray-300">Already have an account? <button onClick={() => setView('login')} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Sign In</button></p>}
                    {view === 'forgotPassword' && <p className="text-gray-600 dark:text-gray-300">Remembered your password? <button onClick={() => setView('login')} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Sign In</button></p>}
                </div>
            </div>
        </div>
    );
};

export default Login;
