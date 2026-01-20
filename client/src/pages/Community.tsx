import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Search as SearchIcon,
  Plus,
  Award,
  TrendingUp,
  Filter,
} from "lucide-react";

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  liked: boolean;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specialization: string;
  followers: number;
  posts: number;
  isFollowing: boolean;
}

export default function Community() {
  const [activeTab, setActiveTab] = useState<"feed" | "members" | "discussions">(
    "feed"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: {
        name: "Dr. Sarah Mwangi",
        avatar: "https://via.placeholder.com/40?text=SM",
        title: "Pediatric Emergency Specialist",
      },
      content:
        "Just completed the Advanced Cardiac Life Support certification! The new protocols are game-changing for our emergency department. Highly recommend this course to all providers.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 234,
      comments: 45,
      shares: 12,
      tags: ["ACLS", "certification", "emergency"],
      liked: false,
    },
    {
      id: "2",
      author: {
        name: "Prof. James Kipchoge",
        avatar: "https://via.placeholder.com/40?text=JK",
        title: "Head of Pediatrics",
      },
      content:
        "Excited to announce that our hospital has trained 500+ healthcare providers through the Paeds Resus platform. The impact on patient outcomes has been remarkable!",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      likes: 567,
      comments: 89,
      shares: 234,
      tags: ["milestone", "training", "impact"],
      liked: true,
    },
    {
      id: "3",
      author: {
        name: "Dr. Emily Okonkwo",
        avatar: "https://via.placeholder.com/40?text=EO",
        title: "PALS Instructor",
      },
      content:
        "Question: Has anyone implemented the new pediatric sepsis protocol? Would love to hear about your experiences and any challenges you've faced.",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      likes: 145,
      comments: 67,
      shares: 8,
      tags: ["sepsis", "protocol", "discussion"],
      liked: false,
    },
  ]);

  const [members] = useState<Member[]>([
    {
      id: "1",
      name: "Dr. Sarah Mwangi",
      avatar: "https://via.placeholder.com/60?text=SM",
      title: "Pediatric Emergency Specialist",
      specialization: "Emergency Medicine",
      followers: 1250,
      posts: 156,
      isFollowing: false,
    },
    {
      id: "2",
      name: "Prof. James Kipchoge",
      avatar: "https://via.placeholder.com/60?text=JK",
      title: "Head of Pediatrics",
      specialization: "Pediatrics",
      followers: 2340,
      posts: 289,
      isFollowing: true,
    },
    {
      id: "3",
      name: "Dr. Emily Okonkwo",
      avatar: "https://via.placeholder.com/60?text=EO",
      title: "PALS Instructor",
      specialization: "Training & Education",
      followers: 890,
      posts: 123,
      isFollowing: false,
    },
    {
      id: "4",
      name: "Dr. Michael Kariuki",
      avatar: "https://via.placeholder.com/60?text=MK",
      title: "Anesthesiologist",
      specialization: "Airway Management",
      followers: 1560,
      posts: 198,
      isFollowing: false,
    },
  ]);

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Community</h1>
                <p className="text-gray-600">Connect, learn, and grow with healthcare professionals</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {[
            { id: "feed", label: "Feed", icon: MessageSquare },
            { id: "members", label: "Members", icon: Users },
            { id: "discussions", label: "Discussions", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 font-medium transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Posts */}
            <div className="lg:col-span-2">
              {/* Search */}
              <Card className="p-4 mb-6">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search posts or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Card>

              {/* Posts List */}
              <div className="space-y-4">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <Card key={post.id} className="p-6">
                      {/* Author */}
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {post.author.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {post.author.title}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {post.timestamp.toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-gray-700 mb-4">{post.content}</p>

                      {/* Tags */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex gap-6 text-sm text-gray-600">
                          <span>{post.likes} likes</span>
                          <span>{post.comments} comments</span>
                          <span>{post.shares} shares</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1 ${
                              post.liked ? "text-red-600" : "text-gray-600"
                            }`}
                          >
                            <Heart
                              className="w-4 h-4"
                              fill={post.liked ? "currentColor" : "none"}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-gray-600"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-gray-600"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No posts found</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Featured Members */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Featured Members
                </h3>
                <div className="space-y-3">
                  {members.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {member.followers} followers
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Community Stats */}
              <Card className="p-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Members</span>
                    <span className="font-semibold text-gray-900">2,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Posts</span>
                    <span className="font-semibold text-gray-900">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discussions</span>
                    <span className="font-semibold text-gray-900">567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-semibold text-gray-900">+234</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div>
            <Card className="p-4 mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  className="pl-10"
                />
              </div>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="p-6 text-center">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3"
                  />
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{member.title}</p>
                  <p className="text-xs text-gray-500 mb-4">{member.specialization}</p>

                  <div className="flex justify-around mb-4 text-center">
                    <div>
                      <p className="font-semibold text-gray-900">{member.followers}</p>
                      <p className="text-xs text-gray-600">Followers</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{member.posts}</p>
                      <p className="text-xs text-gray-600">Posts</p>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {member.isFollowing ? "Following" : "Follow"}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === "discussions" && (
          <div className="space-y-4">
            {[
              {
                title: "Best practices for pediatric airway management",
                replies: 45,
                views: 1200,
                lastActive: "2 hours ago",
              },
              {
                title: "New sepsis protocol implementation challenges",
                replies: 32,
                views: 890,
                lastActive: "5 hours ago",
              },
              {
                title: "Cardiac arrest outcomes - sharing your experiences",
                replies: 67,
                views: 2100,
                lastActive: "1 day ago",
              },
            ].map((discussion, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {discussion.title}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{discussion.replies} replies</span>
                      <span>{discussion.views} views</span>
                      <span>Last active: {discussion.lastActive}</span>
                    </div>
                  </div>
                  <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
