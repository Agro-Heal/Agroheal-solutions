export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoId: string; // YouTube video ID
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  rating: number;
  free: boolean;
  category: string;
}

export const courses: Course[] = [
  {
    id: 1,
    slug: "introduction-to-organic-farming",
    title: "Introduction to Organic Farming",
    description:
      "Learn the fundamentals of organic agriculture and sustainable practices.",
    duration: "2h 30m",
    lessons: [
      {
        id: "1-1",
        title: "What is Organic Farming?",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "1-2",
        title: "History of Organic Agriculture",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "1-3",
        title: "Benefits of Going Organic",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "1-4",
        title: "Organic Certification Basics",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "1-5",
        title: "Setting Up Your First Plot",
        duration: "25:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "1-6",
        title: "Essential Tools & Equipment",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "1-7",
        title: "Seasonal Planning Overview",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "1-8",
        title: "Getting Started: Action Plan",
        duration: "12:00",
        videoId: "dQw4w9WgXcQ",
      },
    ],
    rating: 4.9,
    free: true,
    category: "Foundations",
  },
  {
    id: 2,
    slug: "soil-health-composting",
    title: "Soil Health & Composting",
    description:
      "Master the art of building healthy soil through composting techniques.",
    duration: "3h 15m",
    lessons: [
      {
        id: "2-1",
        title: "Understanding Soil Biology",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-2",
        title: "Soil Testing & Analysis",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-3",
        title: "Composting Fundamentals",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-4",
        title: "Hot vs Cold Composting",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-5",
        title: "Vermicomposting Techniques",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-6",
        title: "Green Manures & Cover Crops",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-7",
        title: "Mulching Strategies",
        duration: "16:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-8",
        title: "Building Long-term Soil Health",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-9",
        title: "Troubleshooting Soil Problems",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-10",
        title: "Soil Amendment Recipes",
        duration: "12:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-11",
        title: "Organic Matter Management",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "2-12",
        title: "Final Project: Soil Plan",
        duration: "10:00",
        videoId: "dQw4w9WgXcQ",
      },
    ],
    rating: 4.8,
    free: false,
    category: "Soil",
  },
  {
    id: 3,
    slug: "organic-pest-management",
    title: "Organic Pest Management",
    description:
      "Natural methods to protect your crops without harmful chemicals.",
    duration: "2h 45m",
    lessons: [
      {
        id: "3-1",
        title: "Understanding Pest Ecology",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-2",
        title: "Beneficial Insects",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-3",
        title: "Companion Planting",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-4",
        title: "Natural Pest Deterrents",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-5",
        title: "DIY Organic Sprays",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-6",
        title: "Crop Rotation for Pest Control",
        duration: "16:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-7",
        title: "Physical Barriers & Traps",
        duration: "14:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-8",
        title: "Disease Prevention",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-9",
        title: "Integrated Pest Management",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "3-10",
        title: "Case Studies & Solutions",
        duration: "12:00",
        videoId: "dQw4w9WgXcQ",
      },
    ],
    rating: 4.7,
    free: false,
    category: "Pest",
  },
  {
    id: 4,
    slug: "crop-rotation-planning",
    title: "Crop Rotation & Planning",
    description:
      "Strategic planning for maximum yield and soil sustainability.",
    duration: "4h 00m",
    lessons: [
      {
        id: "4-1",
        title: "Principles of Crop Rotation",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-2",
        title: "Plant Families & Grouping",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-3",
        title: "Creating a Rotation Schedule",
        duration: "25:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-4",
        title: "Seasonal Crop Planning",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-5",
        title: "Succession Planting",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-6",
        title: "Intercropping Strategies",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-7",
        title: "Yield Optimization",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-8",
        title: "Record Keeping Systems",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-9",
        title: "Market-Driven Planning",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-10",
        title: "Climate Considerations",
        duration: "16:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-11",
        title: "Resource Allocation",
        duration: "14:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-12",
        title: "Multi-Year Planning",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-13",
        title: "Common Mistakes to Avoid",
        duration: "12:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-14",
        title: "Technology Tools for Planning",
        duration: "10:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "4-15",
        title: "Building Your Farm Plan",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
    ],
    rating: 4.9,
    free: false,
    category: "Planning",
  },
  {
    id: 5,
    slug: "water-conservation-techniques",
    title: "Water Conservation Techniques",
    description: "Efficient irrigation and water management for organic farms.",
    duration: "2h 00m",
    lessons: [
      {
        id: "5-1",
        title: "Water in Organic Systems",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "5-2",
        title: "Drip Irrigation Setup",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "5-3",
        title: "Rainwater Harvesting",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "5-4",
        title: "Mulching for Moisture",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "5-5",
        title: "Drought-Resistant Practices",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "5-6",
        title: "Irrigation Scheduling",
        duration: "16:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "5-7",
        title: "Water Quality Considerations",
        duration: "14:00",
        videoId: "dQw4w9WgXcQ",
      },
    ],
    rating: 4.6,
    free: false,
    category: "Water",
  },
  {
    id: 6,
    slug: "harvest-post-harvest-handling",
    title: "Harvest & Post-Harvest Handling",
    description:
      "Best practices for harvesting and preserving your organic produce.",
    duration: "3h 30m",
    lessons: [
      {
        id: "6-1",
        title: "Timing Your Harvest",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-2",
        title: "Harvesting Techniques",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-3",
        title: "Handling & Storage",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-4",
        title: "Cleaning & Grading",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-5",
        title: "Packaging for Market",
        duration: "16:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-6",
        title: "Cold Chain Management",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-7",
        title: "Preservation Methods",
        duration: "22:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-8",
        title: "Value-Added Products",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-9",
        title: "Reducing Post-Harvest Loss",
        duration: "15:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-10",
        title: "Quality Control",
        duration: "20:00",
        videoId: "dQw4w9WgXcQ",
      },
      {
        id: "6-11",
        title: "Marketing Your Produce",
        duration: "18:00",
        videoId: "dQw4w9WgXcQ",
      },
    ],
    rating: 4.8,
    free: false,
    category: "Harvest",
  },
];

export const getCourseBySlug = (slug: string): Course | undefined => {
  return courses.find((course) => course.slug === slug);
};
