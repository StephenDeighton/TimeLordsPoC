import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, ArrowLeft, Upload, AlertCircle, User } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  bio: z.string().optional(),
  interests: z.string().optional(),
  services_offered: z.string().optional(),
  avatar: z
    .instanceof(FileList)
    .optional()
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, 'Max file size is 5MB.')
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const Profile = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const initializeProfile = async () => {
      if (!authState.session?.user.id) return;

      try {
        // First, try to get the existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authState.session.user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!existingProfile) {
          // If profile doesn't exist, create an empty one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authState.session.user.id,
                full_name: '',
                bio: '',
                interests: [],
                services_offered: [],
              }
            ]);

          if (insertError) throw insertError;

          // Reset form with empty values
          reset({
            full_name: '',
            bio: '',
            interests: '',
            services_offered: '',
          });
        } else {
          // Reset form with existing values
          reset({
            full_name: existingProfile.full_name || '',
            bio: existingProfile.bio || '',
            interests: existingProfile.interests?.join(', ') || '',
            services_offered: existingProfile.services_offered?.join(', ') || '',
          });

          // Set avatar URL if it exists
          if (existingProfile.avatar_url) {
            const { data: { publicUrl } } = supabase
              .storage
              .from('avatars')
              .getPublicUrl(existingProfile.avatar_url);
            setAvatarUrl(publicUrl);
          }
        }
      } catch (error) {
        console.error('Error initializing profile:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, [authState.session?.user.id, reset]);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${authState.session?.user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!authState.session?.user.id) return;

    try {
      setUploadError(null);
      let avatarPath = null;

      // Handle avatar upload if a file was selected
      if (data.avatar && data.avatar.length > 0) {
        avatarPath = await uploadAvatar(data.avatar[0]);
        if (!avatarPath) {
          setUploadError('Failed to upload avatar');
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: authState.session.user.id,
          full_name: data.full_name,
          bio: data.bio || '',
          interests: data.interests ? data.interests.split(',').map(i => i.trim()) : [],
          services_offered: data.services_offered ? data.services_offered.split(',').map(s => s.trim()) : [],
          ...(avatarPath && { avatar_url: avatarPath }),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      setUploadError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Time Lords Network</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="mt-8">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This information will be displayed publicly so be careful what you share.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <div className="flex items-center space-x-6">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <label
                            htmlFor="avatar"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Change Avatar
                          </label>
                          <input
                            type="file"
                            id="avatar"
                            className="sr-only"
                            accept="image/*"
                            {...register('avatar')}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            JPG, PNG or WebP. Max 5MB.
                          </p>
                          {errors.avatar && (
                            <p className="mt-1 text-xs text-red-500">{errors.avatar.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="col-span-6">
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                              <p className="text-sm text-red-700">{uploadError}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-span-6">
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        {...register('full_name')}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      {errors.full_name && (
                        <p className="mt-2 text-sm text-red-600">{errors.full_name.message}</p>
                      )}
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <textarea
                        {...register('bio')}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                        Interests
                      </label>
                      <input
                        type="text"
                        {...register('interests')}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Time travel, Quantum mechanics, History (comma separated)"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="services_offered" className="block text-sm font-medium text-gray-700">
                        Services Offered
                      </label>
                      <input
                        type="text"
                        {...register('services_offered')}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Time machine repair, Historical consulting (comma separated)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};