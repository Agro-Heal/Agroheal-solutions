import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Leaf,
  LockOpen,
  Play,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COURSESDATA } from "@/helpers/courses";

const Courses = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Featured track header */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-sm">
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#e8b130]/10 via-[#d17547]/10 to-[#e8b130]/10"
              aria-hidden="true"
            />
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
            />
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative p-8 md:p-10">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="grid lg:grid-cols-12 gap-10 items-center"
              >
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-800/30 bg-green-800/15 px-4 py-2 text-sm font-semibold text-green-800">
                    <Leaf className="h-4 w-4 text-green-800" />
                    Featured track
                  </div>
                  <h1 className="mt-5  text-4xl md:text-5xl font-bold text-foreground leading-[1.05]">
                    Organic Farming Foundations
                  </h1>
                  <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                    Start your organic farming journey with the essentials -
                    Introduction to Organic farming, How to produce Organic
                    inputs - biofertilizers, biopesticides, as well as BSFL
                    cultivation (the ultimate game changer!)
                  </p>

                  <div className="hidden mt-7 flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="bg-green-800 text-white cursor-pointer"
                    >
                      <Link
                        to="#course-list"
                        className="flex items-center gap-2"
                      >
                        <span>Browse courses</span>
                        <ArrowRight className="" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg">
                      <Link
                        to="/signup"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        Start learning
                        <BookOpen className="" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full text-white bg-green-800">
                      YouTube video lessons
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      Beginner-friendly
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      Simple progress tracking
                    </Badge>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <Card className="overflow-hidden border-border/60 bg-background/50">
                    <CardHeader className="pb-4">
                      <CardTitle className=" text-2xl">
                        What you’ll learn
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {[
                          { title: "Soil health & composting", tag: "Core" },
                          {
                            title: "Organic inputs production",
                            tag: "Core",
                          },
                          { title: "Crops & Livestock farming", tag: "Core" },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3"
                          >
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-800/20 bg-green-800/10">
                                <Play className="h-4 w-4 text-green-800" />
                              </span>
                              {item.title}
                            </span>
                            <Badge className="rounded-full bg-green-800 text-white">
                              {item.tag}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Courses are delivered via embedded YouTube videos.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Subscription Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden bg-gradient-hero rounded-2xl p-8 my-12 text-center"
          >
            <h3 className=" text-2xl font-bold text-primary-foreground mb-2">
              Available Courses
            </h3>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Monthly access to all courses, new content monthly, and priority
              support.
            </p>
            {/* <Button size="lg" className="text-white bg-[#d17547]">
              <Link to="#courses-lists">Start now</Link>
            </Button> */}
          </motion.div>

          {/* Filters */}
          <div id="course-list" className="scroll-mt-28 mt-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div>
                <h2 className=" text-3xl md:text-4xl font-bold text-foreground">
                  All courses
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Find by category to get the right lesson track.
                </p>
              </div>
            </div>

            {/* Course Grid */}
            <div
              id="courses-lists"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {COURSESDATA.map((course, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="group"
                >
                  <Link to={`/dashboard/courses/${course?.slug}`}>
                    <Card className="h-full overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                      {/* Thumbnail */}
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* <div className="w-14 h-14 rounded-full bg-background/80 border border-border flex items-center justify-center group-hover:scale-110 transition-transform shadow-elevated">
                            <Play className="w-6 h-6 text-primary ml-1" />
                            <img src={course?.Image} alt="" />
                          </div> */}
                          <div
                            className="h-64 w-full bg-cover bg-center rounded-lg"
                            style={{ backgroundImage: `url(${course?.Image})` }}
                          ></div>
                        </div>

                        <div className="absolute top-3 left-3">
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-[#d17547] text-white"
                          >
                            {course.category}
                          </Badge>
                        </div>

                        <div className="absolute top-3 right-3">
                          {/* {course.free ? (
                          <Badge className="rounded-full bg-green-800 text-white">
                            FREE
                          </Badge>
                        ) : ( */}
                          <Badge
                            variant="outline"
                            className="rounded-full inline-flex items-center gap-1 bg-white "
                          >
                            <LockOpen className="w-3 h-3" />
                            Free
                          </Badge>
                          {/* )} */}
                        </div>
                      </div>

                      {/* Content */}
                      <CardContent className="p-6 flex flex-col" key={index}>
                        <h3 className="cursor-pointer text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {course.category}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {course?.duration}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course?.lessons.length} lessons
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1 text-accent font-medium">
                            <Star className="w-4 h-4 fill-accent" />
                            {/* {courseItem.rating} */} 5 star
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Courses;
