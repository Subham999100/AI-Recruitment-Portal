import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Users, Mail, Lock, User as UserIcon } from 'lucide-react';
import { authService } from '../services/authService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardContent } from '../components/common/Card';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await authService.register(data);
      setSuccessMsg('Registration submitted successfully. Your account is waiting for administrator approval.');
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      const message = (err as any)?.response?.data?.detail;
      setErrorMsg(message || (err instanceof Error ? err.message : 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
          <Users className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the HR Portal today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-4 sm:px-10">
            {successMsg ? (
              <div className="p-4 bg-green-50 text-green-700 rounded-md text-center mb-6 border border-green-200">
                {successMsg}
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  leftIcon={<UserIcon className="w-5 h-5" />}
                  error={errors.name?.message as string}
                  {...register('name', { required: 'Full name is required' })}
                />

                <Input
                  label="Email address"
                  type="email"
                  placeholder="john@example.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message as string}
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  error={errors.password?.message as string}
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Password must contain a letter and a number' }
                  })}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                  error={errors.confirmPassword?.message as string}
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Register
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
