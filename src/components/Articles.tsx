import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, User, Calendar, Tag, AlertCircle, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  author: {
    full_name: string;
  };
}

export const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select(`
            id,
            title,
            content,
            category,
            tags,
            created_at,
            author:profiles!fk_author(full_name)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err: any) {
        console.error('Error fetching articles:', err);
        setError(err.message || 'An error occurred while fetching articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Time Lords Network</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/articles/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Article
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Articles</h2>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : !error && articles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Yet</h3>
              <p className="text-gray-500 mb-4">Be the first to share your knowledge!</p>
              <button
                onClick={() => navigate('/articles/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Article
              </button>
            </div>
          ) : !error && (
            <div className="space-y-6">
              {articles.map((article) => (
                <article key={article.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>{article.author.full_name}</span>
                        <span>•</span>
                        <span>{format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      {article.category && (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          {article.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{article.content}</p>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 bg-gray-50">
                    <button className="text-indigo-600 hover:text-indigo-500 font-medium text-sm">
                      Read more →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};