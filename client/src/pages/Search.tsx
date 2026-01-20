import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search as SearchIcon,
  Filter,
  X,
  Star,
  Users,
  Clock,
  TrendingUp,
  Grid,
  List,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  rating: number;
  reviews: number;
  students: number;
  price: number;
  instructor: string;
  image: string;
  tags: string[];
}

const mockCourses: Course[] = [
  {
    id: "1",
    title: "BLS Fundamentals",
    description: "Learn basic life support techniques for pediatric patients",
    category: "BLS",
    level: "beginner",
    duration: 4,
    rating: 4.8,
    reviews: 245,
    students: 1200,
    price: 5000,
    instructor: "Dr. Sarah Mwangi",
    image: "https://via.placeholder.com/300x200?text=BLS",
    tags: ["CPR", "Pediatric", "Emergency"],
  },
  {
    id: "2",
    title: "Advanced Cardiac Life Support",
    description: "Master ACLS protocols for complex cardiac emergencies",
    category: "ACLS",
    level: "advanced",
    duration: 8,
    rating: 4.9,
    reviews: 189,
    students: 890,
    price: 7500,
    instructor: "Prof. James Kipchoge",
    image: "https://via.placeholder.com/300x200?text=ACLS",
    tags: ["Cardiac", "Advanced", "Protocols"],
  },
  {
    id: "3",
    title: "Pediatric Advanced Life Support",
    description: "Specialized PALS training for pediatric emergencies",
    category: "PALS",
    level: "intermediate",
    duration: 6,
    rating: 4.7,
    reviews: 156,
    students: 750,
    price: 6000,
    instructor: "Dr. Emily Okonkwo",
    image: "https://via.placeholder.com/300x200?text=PALS",
    tags: ["Pediatric", "PALS", "Emergency"],
  },
  {
    id: "4",
    title: "Airway Management Mastery",
    description: "Advanced techniques for difficult airway management",
    category: "Airway",
    level: "advanced",
    duration: 5,
    rating: 4.6,
    reviews: 123,
    students: 560,
    price: 6500,
    instructor: "Dr. Michael Kariuki",
    image: "https://via.placeholder.com/300x200?text=Airway",
    tags: ["Airway", "Intubation", "Advanced"],
  },
  {
    id: "5",
    title: "Neonatal Resuscitation Program",
    description: "Comprehensive NRP training for newborn resuscitation",
    category: "NRP",
    level: "intermediate",
    duration: 4,
    rating: 4.8,
    reviews: 198,
    students: 920,
    price: 5500,
    instructor: "Dr. Grace Njoroge",
    image: "https://via.placeholder.com/300x200?text=NRP",
    tags: ["Neonatal", "Newborn", "Resuscitation"],
  },
  {
    id: "6",
    title: "Trauma Management Essentials",
    description: "Essential trauma management skills for emergency providers",
    category: "Trauma",
    level: "intermediate",
    duration: 7,
    rating: 4.5,
    reviews: 142,
    students: 680,
    price: 6800,
    instructor: "Dr. David Mwangi",
    image: "https://via.placeholder.com/300x200?text=Trauma",
    tags: ["Trauma", "Emergency", "Management"],
  },
];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<"rating" | "students" | "price" | "newest">(
    "rating"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const isLargeScreen = typeof window !== "undefined" && window.innerWidth >= 1024;

  const categories = Array.from(new Set(mockCourses.map((c) => c.category)));
  const levels = ["beginner", "intermediate", "advanced"] as const;

  const filteredCourses = useMemo(() => {
    let results = mockCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory = !selectedCategory || course.category === selectedCategory;
      const matchesLevel = !selectedLevel || course.level === selectedLevel;
      const matchesPrice = course.price >= priceRange[0] && course.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });

    // Sort results
    switch (sortBy) {
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "students":
        results.sort((a, b) => b.students - a.students);
        break;
      case "price":
        results.sort((a, b) => a.price - b.price);
        break;
      case "newest":
        // Assuming newer courses have higher IDs
        results.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
    }

    return results;
  }, [searchQuery, selectedCategory, selectedLevel, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Course</h1>
          <p className="text-gray-600">
            Discover {mockCourses.length} comprehensive training programs
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-6 mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search courses, instructors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {(showFilters || isLargeScreen) && (
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Category</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        !selectedCategory
                          ? "bg-blue-100 text-blue-900 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                          selectedCategory === cat
                            ? "bg-blue-100 text-blue-900 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Level</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedLevel(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        !selectedLevel
                          ? "bg-blue-100 text-blue-900 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      All Levels
                    </button>
                    {levels.map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition capitalize ${
                          selectedLevel === level
                            ? "bg-blue-100 text-blue-900 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], parseInt(e.target.value)])
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>KES {priceRange[0].toLocaleString()}</span>
                      <span>KES {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedCategory || selectedLevel || priceRange[1] < 10000) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedLevel(null);
                      setPriceRange([0, 10000]);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Card>
            </div>
          )}

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {filteredCourses.length} of {mockCourses.length} courses
              </p>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "rating" | "students" | "price" | "newest")}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="students">Most Popular</option>
                  <option value="price">Lowest Price</option>
                  <option value="newest">Newest</option>
                </select>
                <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-gray-200" : ""}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-gray-200" : ""}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Courses Grid/List */}
            {filteredCourses.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid md:grid-cols-2 gap-6"
                    : "space-y-4"
                }
              >
                {filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    className={`overflow-hidden hover:shadow-lg transition cursor-pointer ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    {viewMode === "grid" ? (
                      <>
                        <div className="h-40 bg-gray-200 overflow-hidden">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {course.category}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 capitalize">
                              {course.level}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center gap-4 mb-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">{course.rating}</span>
                              <span className="text-gray-500">({course.reviews})</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              {course.students}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                              KES {course.price.toLocaleString()}
                            </span>
                            <Button size="sm">Enroll</Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-32 h-32 flex-shrink-0 bg-gray-200 overflow-hidden">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {course.title}
                              </h3>
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {course.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {course.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span>{course.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {course.duration}h
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {course.students}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-lg font-bold">
                              KES {course.price.toLocaleString()}
                            </span>
                            <Button size="sm">Enroll</Button>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filters to find what you're looking for
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
