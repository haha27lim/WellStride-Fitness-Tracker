import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { register, clearError } from '@/store/slices/authSlice';
import '../styles/components/Register.css';


const RegisterPage = () => {
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { status, error, isAuthenticated } = useAppSelector((state) => state.auth);
    const [, setIsGoogleRedirect] = useState(false);

    const handleGoogleSignup = () => {
        setIsGoogleRedirect(true);
        window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`;
    };

    const handleRegister = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        setPasswordError('');
        const signupData = { username, email, password };
        dispatch(register(signupData))
            .unwrap()
            .then(() => {

                navigate('/login');
            })
            .catch(() => {

            });
    };

    React.useEffect(() => {
        dispatch(clearError());
        return () => dispatch(clearError());
    }, [dispatch]);

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>Create your fitness tracker account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <button
                                type="button"
                                onClick={handleGoogleSignup}
                                className="google-login-button"
                            >
                                <img
                                    src="/google-icon.svg"
                                    alt="Google"
                                    className="google-icon"
                                />
                                Sign up with Google
                            </button>
                        </div>

                        <div className="or-login-with">Or sign up with</div>

                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                        <Button type="submit" className="w-full mt-4" disabled={status === 'loading'}>
                            {status === 'loading' ? 'Registering...' : 'Register'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link to="/login" className="underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;