export interface Exercise {
  name: string;
  icon: string;
  pool: 'chest' | 'back' | 'shoulders' | 'legs' | 'biceps' | 'triceps' | 'core';
}

export const POOLS: Record<string, Exercise[]> = {
  chest: [
    { name: "Archer Push Ups", icon: "Activity", pool: "chest" },
    { name: "Barbell Bench Press", icon: "Dumbbell", pool: "chest" },
    { name: "Barbell Incline Bench Press", icon: "ArrowUp", pool: "chest" },
    { name: "Cable Flyes", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Chest Dips", icon: "ArrowDown", pool: "chest" },
    { name: "Decline Dumbbell Bench Press", icon: "ArrowDown", pool: "chest" },
    { name: "Decline Dumbbell Fly", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Decline Push Ups", icon: "ArrowDown", pool: "chest" },
    { name: "Dumbbell Bench Press", icon: "Dumbbell", pool: "chest" },
    { name: "Dumbbell Chest Fly", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Incline Dumbbell Chest Fly", icon: "ArrowUp", pool: "chest" },
    { name: "Incline Dumbbell Chest Press", icon: "ArrowUp", pool: "chest" },
    { name: "Incline Push Ups", icon: "ArrowUp", pool: "chest" },
    { name: "Machine Fly", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Machine Chest Press", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Machine Incline Press", icon: "ArrowUp", pool: "chest" },
    { name: "Push Ups", icon: "Activity", pool: "chest" },
    { name: "Seated Cable Fly", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Seated Chest Press", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Single Arm Chest Press", icon: "Dumbbell", pool: "chest" },
    { name: "Single Arm Chest Fly", icon: "ArrowLeftRight", pool: "chest" },
    { name: "Weighted Chest Dips", icon: "Plus", pool: "chest" },
    { name: "High to Low Cable Flys", icon: "ArrowDown", pool: "chest" },
    { name: "Low to High Cable Flys", icon: "ArrowUp", pool: "chest" }
  ],
  back: [
    { name: "Barbell Bent Over Row", icon: "ArrowLeftRight", pool: "back" },
    { name: "Close Grip Lat Pulldown", icon: "ArrowDown", pool: "back" },
    { name: "Dumbbell Bent Over Row", icon: "ArrowLeftRight", pool: "back" },
    { name: "Incline Row (Chest Supported)", icon: "ArrowLeftRight", pool: "back" },
    { name: "Inverted Row", icon: "ArrowLeftRight", pool: "back" },
    { name: "Lat Pulldowns", icon: "ArrowDown", pool: "back" },
    { name: "Pendlay Row", icon: "ArrowLeftRight", pool: "back" },
    { name: "Rack Pulls", icon: "ArrowUp", pool: "back" },
    { name: "Seated Cable Row", icon: "ArrowLeftRight", pool: "back" },
    { name: "Single Arm Bent Over Row", icon: "ArrowLeftRight", pool: "back" },
    { name: "Single Arm Lat Pulldowns", icon: "ArrowDown", pool: "back" },
    { name: "Straight Arm Lat Pulldowns", icon: "ArrowDown", pool: "back" },
    { name: "T Bar Row", icon: "ArrowLeftRight", pool: "back" },
    { name: "Wide Grip Lat Pulldowns", icon: "ArrowDown", pool: "back" },
    { name: "Machine Row", icon: "ArrowLeftRight", pool: "back" }
  ],
  shoulders: [
    { name: "Arnold Press", icon: "ArrowUpCircle", pool: "shoulders" },
    { name: "Barbell Front Raise", icon: "ArrowUp", pool: "shoulders" },
    { name: "Cable Lateral Raise", icon: "ArrowLeftRight", pool: "shoulders" },
    { name: "Dumbbell Lateral Raise", icon: "ArrowLeftRight", pool: "shoulders" },
    { name: "Dumbbell Shoulder Press", icon: "ArrowUpCircle", pool: "shoulders" },
    { name: "Face Pulls", icon: "ArrowLeftRight", pool: "shoulders" },
    { name: "Military Press", icon: "ArrowUpCircle", pool: "shoulders" },
    { name: "Rear Delt Flyes", icon: "ArrowLeftRight", pool: "shoulders" },
    { name: "Shoulder Press Machine", icon: "ArrowUpCircle", pool: "shoulders" },
    { name: "Machine Shoulder Press", icon: "ArrowUpCircle", pool: "shoulders" }
  ],
  legs: [
    { name: "Barbell Back Squat", icon: "ArrowDown", pool: "legs" },
    { name: "Bulgarian Split Squats", icon: "Flame", pool: "legs" },
    { name: "Conventional Deadlift", icon: "ArrowUp", pool: "legs" },
    { name: "Goblet Squat", icon: "ArrowDown", pool: "legs" },
    { name: "Hack Squat", icon: "ArrowDown", pool: "legs" },
    { name: "Leg Extensions", icon: "ArrowUp", pool: "legs" },
    { name: "Lunges", icon: "Flame", pool: "legs" },
    { name: "Lying Hamstring Curl", icon: "ArrowDown", pool: "legs" },
    { name: "Romanian Deadlift", icon: "ArrowUp", pool: "legs" },
    { name: "Seated Leg Press", icon: "ArrowDown", pool: "legs" },
    { name: "Sumo Deadlift", icon: "ArrowUp", pool: "legs" }
  ],
  biceps: [
    { name: "Barbell Bicep Curl", icon: "ArrowUpCircle", pool: "biceps" },
    { name: "Cable Bicep Curls", icon: "ArrowUpCircle", pool: "biceps" },
    { name: "Concentration Curls", icon: "ArrowUpCircle", pool: "biceps" },
    { name: "Dumbbell Bicep Curls", icon: "ArrowUpCircle", pool: "biceps" },
    { name: "Hammer Curls", icon: "ArrowUpCircle", pool: "biceps" },
    { name: "Preacher Curls", icon: "ArrowUpCircle", pool: "biceps" },
    { name: "Spider Curls", icon: "ArrowUpCircle", pool: "biceps" },
    { name: "Machine Bicep Curl", icon: "ArrowUpCircle", pool: "biceps" }
  ],
  triceps: [
    { name: "Close Grip Bench Press", icon: "Dumbbell", pool: "triceps" },
    { name: "Dumbbell Floor Fly", icon: "ArrowLeftRight", pool: "triceps" }, // Note: This was in push, adjusted category
    { name: "Machine Triceps Extension", icon: "ArrowDown", pool: "triceps" },
    { name: "Overhead Tricep Extension", icon: "ArrowUpCircle", pool: "triceps" },
    { name: "Skull Crushers", icon: "ArrowDown", pool: "triceps" },
    { name: "Tricep Dips", icon: "ArrowDown", pool: "triceps" },
    { name: "Tricep Pushdowns", icon: "ArrowDown", pool: "triceps" },
    { name: "Tricep Push Ups", icon: "Activity", pool: "triceps" }
  ],
  core: [
    { name: "Ab Crunches", icon: "Activity", pool: "core" },
    { name: "Ab Wheel Rollouts", icon: "RotateCw", pool: "core" },
    { name: "Bicycle Crunches", icon: "Activity", pool: "core" },
    { name: "Hanging Leg Raises", icon: "ArrowUp", pool: "core" },
    { name: "Plank", icon: "Activity", pool: "core" },
    { name: "Russian Twists", icon: "RotateCw", pool: "core" },
    { name: "Sit Ups", icon: "Activity", pool: "core" }
  ]
};
