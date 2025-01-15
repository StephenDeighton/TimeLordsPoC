import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, Send, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export const CreateArticle = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
  });

  const onSubmit = async (data: ArticleFormData) => {
    if (!authState.session?.user.id) return;

    try {
      const { error } = await supabase
        .from('articles')
        .insert([
          {
            author_id: authState.session.user.id,
            title: data.title,
            content: data.content,
            category: data.category,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
            status: 'published', // You might want to add a draft option
          }
        ]);

      if (error) throw error;
      navigate('/articles');
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Time Lords Network</span>
          </div>
          <button
            onClick={() => navigate('/articles')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </button>
        </div>

        <div className="mt-8">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Article</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <input
                      type="text"
                      {...register('category')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., Time Travel, History, Science"
                    />
                    {errors.category && (
                      <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <div className="relative flex items-stretch flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Tag className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register('tags')}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="time-travel, history, quantum-mechanics (comma separated)"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      {...register('content')}
                      rows={8}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.content && (
                      <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Publishing...' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};