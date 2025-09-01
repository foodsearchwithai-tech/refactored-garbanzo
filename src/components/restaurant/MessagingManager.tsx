'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  MapPin, 
  Clock,
  Plus,
  X,
  Check,
  AlertTriangle,
  Filter,
  Search,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';

interface Message {
  id: string;
  restaurantId: string;
  message: string;
  radiusKm: number;
  offerType: string;
  isActive: boolean;
  sentAt: string;
  expiresAt?: string;
  recipientCount: number;
  viewCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

interface MessagingManagerProps {
  restaurantId: string;
}

export default function MessagingManager({ }: MessagingManagerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    radiusKm: 5,
    offerType: 'promotion',
    expiresIn: 24 // hours
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/restaurant/messages');
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        throw new Error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setErrorMessage('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Clear messages after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message content is required';
    } else if (formData.message.length > 500) {
      newErrors.message = 'Message must be less than 500 characters';
    }
    
    if (formData.radiusKm < 1 || formData.radiusKm > 25) {
      newErrors.radiusKm = 'Radius must be between 1 and 25 km';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create new message
  const handleCreateMessage = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/restaurant/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          radiusKm: formData.radiusKm,
          offerType: formData.offerType,
          expiresIn: formData.expiresIn
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(`Message sent successfully to ${result.recipientCount} nearby customers!`);
        setFormData({ title: '', message: '', radiusKm: 5, offerType: 'promotion', expiresIn: 24 });
        setShowCreateForm(false);
        await fetchMessages();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error creating message:', error);
      setErrorMessage('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update message
  const handleUpdateMessage = async () => {
    if (!editingMessage || !validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/restaurant/messages/${editingMessage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          radiusKm: formData.radiusKm,
          offerType: formData.offerType,
          isActive: editingMessage.isActive
        })
      });
      
      if (response.ok) {
        setSuccessMessage('Message updated successfully!');
        setEditingMessage(null);
        setFormData({ title: '', message: '', radiusKm: 5, offerType: 'promotion', expiresIn: 24 });
        await fetchMessages();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update message');
      }
    } catch (error) {
      console.error('Error updating message:', error);
      setErrorMessage('Failed to update message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await fetch(`/api/restaurant/messages/${messageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccessMessage('Message deleted successfully!');
        await fetchMessages();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setErrorMessage('Failed to delete message. Please try again.');
    }
  };

  // Toggle message status
  const handleToggleStatus = async (message: Message) => {
    try {
      const response = await fetch(`/api/restaurant/messages/${message.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...message,
          isActive: !message.isActive
        })
      });
      
      if (response.ok) {
        setSuccessMessage(`Message ${!message.isActive ? 'activated' : 'deactivated'} successfully!`);
        await fetchMessages();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update message status');
      }
    } catch (error) {
      console.error('Error toggling message status:', error);
      setErrorMessage('Failed to update message status');
    }
  };

  // Start editing
  const startEditing = (message: Message) => {
    setEditingMessage(message);
    setFormData({
      title: (message.message || '').split('\n')[0] || '', // Use first line as title
      message: message.message || '',
      radiusKm: message.radiusKm || 5,
      offerType: message.offerType || 'promotion',
      expiresIn: 24
    });
    setShowCreateForm(false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage(null);
    setFormData({ title: '', message: '', radiusKm: 5, offerType: 'promotion', expiresIn: 24 });
    setErrors({});
  };

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = (message.message || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && message.isActive) ||
      (filterStatus === 'expired' && !message.isActive);
    
    return matchesSearch && matchesFilter;
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate engagement rate
  const getEngagementRate = (message: Message) => {
    const viewCount = message.viewCount || 0;
    const clickCount = message.clickCount || 0;
    if (viewCount === 0) return 0;
    return Math.round((clickCount / viewCount) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Message Management</h2>
          <p className="text-gray-600">Send targeted offers to nearby customers</p>
        </div>
        
        {!showCreateForm && !editingMessage && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Send New Message
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingMessage) && (
        <Card className="border-orange-200 bg-white shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
            <CardTitle className="flex items-center justify-between text-gray-900">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-orange-500 mr-2" />
                {editingMessage ? 'Edit Message' : 'Send New Message'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  cancelEditing();
                }}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Message Content */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Message Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Special Pizza Offer"
                    className="border-orange-200 focus:border-orange-500"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500">
                    {formData.title.length}/100 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message Content *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Write your promotional message here... (e.g., '🍕 Special offer! 20% off all pizzas today! Visit us now or call for takeaway.')"
                    rows={4}
                    className="border-orange-200 focus:border-orange-500"
                    maxLength={500}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={errors.message ? 'text-red-600' : 'text-gray-500'}>
                      {errors.message || `${formData.message.length}/500 characters`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerType">Offer Type</Label>
                  <select
                    id="offerType"
                    value={formData.offerType}
                    onChange={(e) => setFormData(prev => ({ ...prev, offerType: e.target.value }))}
                    className="w-full px-3 py-2 border border-orange-200 rounded-md focus:border-orange-500 focus:outline-none"
                  >
                    <option value="promotion">Promotion</option>
                    <option value="discount">Discount</option>
                    <option value="special_menu">Special Menu</option>
                    <option value="event">Event</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="radius">Target Radius: {formData.radiusKm} km</Label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      id="radius"
                      min="1"
                      max="25"
                      value={formData.radiusKm}
                      onChange={(e) => setFormData(prev => ({ ...prev, radiusKm: Number(e.target.value) }))}
                      className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <Input
                      type="number"
                      min="1"
                      max="25"
                      value={formData.radiusKm}
                      onChange={(e) => setFormData(prev => ({ ...prev, radiusKm: Number(e.target.value) }))}
                      className="w-20 border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  {errors.radiusKm && (
                    <p className="text-xs text-red-600">{errors.radiusKm}</p>
                  )}
                </div>

                {!editingMessage && (
                  <div className="space-y-2">
                    <Label htmlFor="expiresIn">Expires In (hours)</Label>
                    <select
                      id="expiresIn"
                      value={formData.expiresIn}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresIn: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-orange-200 rounded-md focus:border-orange-500 focus:outline-none"
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={48}>48 hours</option>
                      <option value={72}>72 hours</option>
                      <option value={168}>1 week</option>
                    </select>
                  </div>
                )}

                {/* Preview */}
                <div className="p-4 bg-white border border-orange-200 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded text-sm space-y-2">
                    {formData.title && (
                      <div className="font-semibold text-gray-900">
                        {formData.title}
                      </div>
                    )}
                    <div className="text-gray-800">
                      {formData.message || 'Your message will appear here...'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                    <span>Target: {formData.radiusKm} km radius</span>
                    <span className="capitalize text-orange-600">{(formData.offerType || 'promotion').replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={editingMessage ? handleUpdateMessage : handleCreateMessage}
                disabled={!formData.message.trim() || isSubmitting}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-none"
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingMessage ? 'Updating...' : 'Sending...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {editingMessage ? 'Update Message' : 'Send Message'}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Search */}
      <Card className="border-orange-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-orange-200 focus:border-orange-500"
              />
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expired')}
                className="px-3 py-2 border border-orange-200 rounded-md focus:border-orange-500 focus:outline-none"
              >
                <option value="all">All Messages</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="border-orange-100">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading messages...</p>
            </CardContent>
          </Card>
        ) : filteredMessages.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No messages found' : 'No messages yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start engaging with your customers by sending your first promotional message'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && !showCreateForm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Send First Message
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className={`border-orange-100 ${!message.isActive ? 'opacity-75' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Message Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-gray-900 leading-relaxed mb-2">{message.message || 'No message content'}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            variant={message.isActive ? "default" : "secondary"}
                            className={message.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                          >
                            {message.isActive ? 'Active' : 'Expired'}
                          </Badge>
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            {(message.offerType || 'promotion').replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {message.radiusKm || 5} km radius
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(message)}
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(message)}
                          className={message.isActive ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50" : "border-green-300 text-green-700 hover:bg-green-50"}
                        >
                          {message.isActive ? <Eye className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-orange-100" />

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <Users className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{message.recipientCount || 0}</p>
                        <p className="text-xs text-gray-600">Recipients</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <Eye className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{message.viewCount || 0}</p>
                        <p className="text-xs text-gray-600">Views</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <Target className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{message.clickCount || 0}</p>
                        <p className="text-xs text-gray-600">Clicks</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-gray-900">{getEngagementRate(message)}%</p>
                        <p className="text-xs text-gray-600">Engagement</p>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Sent: {formatDate(message.sentAt)}
                      </div>
                      {message.expiresAt && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Expires: {formatDate(message.expiresAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Tips Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <h4 className="font-medium text-gray-900 mb-3">💡 Messaging Best Practices:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
            <ul className="space-y-2">
              <li>• Include specific offers with percentages or dollar amounts</li>
              <li>• Mention limited time offers to create urgency</li>
              <li>• Add emojis to make your message more engaging</li>
            </ul>
            <ul className="space-y-2">
              <li>• Include your phone number for direct orders</li>
              <li>• Keep messages concise and actionable</li>
              <li>• Target optimal radius based on your location</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
