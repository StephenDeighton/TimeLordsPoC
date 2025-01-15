import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Webinar {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  max_participants: number;
  host: {
    full_name: string;
  };
}

export const Webinars = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        const { data, error } = await supabase
          .from('webinars')
          .select(`
            id,
            title,
            description,
            starts_at,
            ends_at,
            max_participants,
            host:host_id(full_name)
          `)
          .eq('status', 'published')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true });

        if (error) throw error;
        setWebinars(data || []);
      } catch (error) {
        console.error('Error fetching webinars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebinars();
  }, []);

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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Webinars</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : webinars.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Webinars</h3>
              <p className="text-gray-500">Check back later for new webinars.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {webinars.map((webinar) => (
                <div key={webinar.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="h-6 w-6 text-indigo-600" />
                      <span className="text-sm text-gray-500">
                        {format(new Date(webinar.starts_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{webinar.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{webinar.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        {format(new Date(webinar.starts_at), 'h:mm a')} -{' '}
                        {format(new Date(webinar.ends_at), 'h:mm a')}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        {webinar.max_participants} participants max
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50">
                    <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Register for Webinar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};