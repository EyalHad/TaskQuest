use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogSkill {
    pub id: &'static str,
    pub name: &'static str,
    pub icon: &'static str,
    pub description: &'static str,
    pub suggested_quests: &'static [&'static str],
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogGroup {
    pub id: &'static str,
    pub name: &'static str,
    pub icon: &'static str,
    pub skills: &'static [CatalogSkill],
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogCategory {
    pub code: &'static str,
    pub name: &'static str,
    pub icon: &'static str,
    pub groups: &'static [CatalogGroup],
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickStartBundle {
    pub key: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub icon: &'static str,
    pub skill_ids: &'static [&'static str],
}

// ═══════════════════════════════════════════════════════════════════
//  CATALOG DATA
// ═══════════════════════════════════════════════════════════════════

static CATALOG: &[CatalogCategory] = &[
    // ──────────────── INT — Mind & Career ────────────────
    CatalogCategory { code: "INT", name: "Mind & Career", icon: "🧠", groups: &[
        CatalogGroup { id: "int.software", name: "Software Engineering", icon: "💻", skills: &[
            CatalogSkill { id: "int.software.backend", name: "Backend", icon: "⚙️", description: "Server-side logic, APIs, databases", suggested_quests: &["Build a REST endpoint", "Write unit tests", "Optimize a query"] },
            CatalogSkill { id: "int.software.frontend", name: "Frontend", icon: "🌐", description: "UI/UX, HTML/CSS/JS, component design", suggested_quests: &["Build a new component", "Fix a UI bug", "Improve accessibility"] },
            CatalogSkill { id: "int.software.devops", name: "DevOps", icon: "🔄", description: "CI/CD, containers, infrastructure", suggested_quests: &["Set up a pipeline", "Write a Dockerfile", "Monitor an alert"] },
            CatalogSkill { id: "int.software.system_design", name: "System Design", icon: "🏗️", description: "Architecture, scalability, patterns", suggested_quests: &["Diagram a system", "Review an architecture", "Read a design doc"] },
            CatalogSkill { id: "int.software.databases", name: "Databases", icon: "🗃️", description: "SQL, NoSQL, data modeling", suggested_quests: &["Write a migration", "Optimize indexes", "Design a schema"] },
            CatalogSkill { id: "int.software.apis", name: "APIs", icon: "🔌", description: "REST, GraphQL, integrations", suggested_quests: &["Document an endpoint", "Add error handling", "Build a webhook"] },
        ]},
        CatalogGroup { id: "int.leadership", name: "Leadership & Management", icon: "📊", skills: &[
            CatalogSkill { id: "int.leadership.team", name: "Team Management", icon: "👥", description: "Leading people, delegation, feedback", suggested_quests: &["Have a 1:1", "Write a review", "Delegate a task"] },
            CatalogSkill { id: "int.leadership.communication", name: "Communication", icon: "📧", description: "Presenting, writing, meetings", suggested_quests: &["Prepare a presentation", "Write a proposal", "Lead a meeting"] },
            CatalogSkill { id: "int.leadership.decisions", name: "Decision Making", icon: "⚖️", description: "Analysis, trade-offs, prioritization", suggested_quests: &["Write a decision doc", "Prioritize the backlog", "Run a retrospective"] },
            CatalogSkill { id: "int.leadership.mentoring", name: "Mentoring", icon: "🎓", description: "Coaching, pair programming, teaching", suggested_quests: &["Mentor a junior", "Pair program for 1hr", "Write a tutorial"] },
        ]},
        CatalogGroup { id: "int.academic", name: "Academic Studies", icon: "📚", skills: &[
            CatalogSkill { id: "int.academic.math", name: "Mathematics", icon: "🔢", description: "Algebra, calculus, statistics", suggested_quests: &["Solve 10 problems", "Review a chapter", "Practice proofs"] },
            CatalogSkill { id: "int.academic.research", name: "Research", icon: "🔬", description: "Literature review, experiments, papers", suggested_quests: &["Read 2 papers", "Write an abstract", "Analyze results"] },
            CatalogSkill { id: "int.academic.writing", name: "Academic Writing", icon: "✍️", description: "Papers, essays, thesis work", suggested_quests: &["Write 500 words", "Edit a draft", "Format references"] },
            CatalogSkill { id: "int.academic.exams", name: "Exam Prep", icon: "🎯", description: "Studying, flashcards, practice tests", suggested_quests: &["Study 1 hour", "Make flashcards", "Take a practice test"] },
        ]},
        CatalogGroup { id: "int.languages", name: "Languages", icon: "🌍", skills: &[
            CatalogSkill { id: "int.languages.english", name: "English", icon: "🇬🇧", description: "Reading, writing, speaking fluency", suggested_quests: &["Read an article", "Write a paragraph", "Watch a TED talk"] },
            CatalogSkill { id: "int.languages.hebrew", name: "Hebrew", icon: "🇮🇱", description: "Reading, conversation, vocabulary", suggested_quests: &["Learn 10 words", "Read a news article", "Practice conversation"] },
            CatalogSkill { id: "int.languages.spanish", name: "Spanish", icon: "🇪🇸", description: "Grammar, vocabulary, conversation", suggested_quests: &["Do a Duolingo session", "Watch a show in Spanish", "Practice verbs"] },
            CatalogSkill { id: "int.languages.other", name: "Other Language", icon: "🗣️", description: "Any additional language", suggested_quests: &["Study 30 minutes", "Practice with a native speaker", "Translate a text"] },
        ]},
        CatalogGroup { id: "int.finance", name: "Finance & Business", icon: "💰", skills: &[
            CatalogSkill { id: "int.finance.budgeting", name: "Budgeting", icon: "📊", description: "Tracking expenses, saving, planning", suggested_quests: &["Review monthly expenses", "Update the budget", "Cancel an unused subscription"] },
            CatalogSkill { id: "int.finance.investing", name: "Investing", icon: "📈", description: "Stocks, ETFs, retirement planning", suggested_quests: &["Research a stock", "Rebalance portfolio", "Read an investing article"] },
            CatalogSkill { id: "int.finance.entrepreneurship", name: "Entrepreneurship", icon: "🚀", description: "Side projects, business ideas", suggested_quests: &["Validate an idea", "Build an MVP feature", "Talk to a potential user"] },
        ]},
        CatalogGroup { id: "int.creative_tech", name: "Creative Tech", icon: "🎮", skills: &[
            CatalogSkill { id: "int.creative_tech.gamedev", name: "Game Dev", icon: "🎮", description: "Game design, engines, mechanics", suggested_quests: &["Prototype a mechanic", "Design a level", "Playtest and iterate"] },
            CatalogSkill { id: "int.creative_tech.ai_ml", name: "AI & ML", icon: "🤖", description: "Machine learning, data science, AI tools", suggested_quests: &["Train a model", "Clean a dataset", "Read an AI paper"] },
            CatalogSkill { id: "int.creative_tech.mobile", name: "Mobile Apps", icon: "📱", description: "iOS, Android, cross-platform", suggested_quests: &["Build a screen", "Fix a mobile bug", "Test on a device"] },
        ]},
    ]},

    // ──────────────── CRAFT — Home & Hobbies ────────────────
    CatalogCategory { code: "CRAFT", name: "Home & Hobbies", icon: "🔨", groups: &[
        CatalogGroup { id: "craft.diy", name: "DIY & Building", icon: "🪚", skills: &[
            CatalogSkill { id: "craft.diy.woodworking", name: "Woodworking", icon: "🪵", description: "Furniture, shelves, cutting, joining", suggested_quests: &["Sand and finish a piece", "Cut boards to size", "Build a shelf"] },
            CatalogSkill { id: "craft.diy.metalwork", name: "Metalwork", icon: "⚒️", description: "Welding, forging, sheet metal", suggested_quests: &["Weld a joint", "Grind and polish", "Design a metal piece"] },
            CatalogSkill { id: "craft.diy.printing3d", name: "3D Printing", icon: "🖨️", description: "Modeling, slicing, printing", suggested_quests: &["Print a prototype", "Design a model", "Calibrate the printer"] },
            CatalogSkill { id: "craft.diy.home_repair", name: "Home Repairs", icon: "🔧", description: "Fixing, patching, maintaining", suggested_quests: &["Fix a leaky faucet", "Patch a wall", "Replace a fixture"] },
            CatalogSkill { id: "craft.diy.electrical", name: "Electrical", icon: "⚡", description: "Wiring, outlets, lighting", suggested_quests: &["Install a light", "Replace a switch", "Run a cable"] },
            CatalogSkill { id: "craft.diy.plumbing", name: "Plumbing", icon: "🚿", description: "Pipes, drains, water systems", suggested_quests: &["Unclog a drain", "Replace a valve", "Install a fixture"] },
            CatalogSkill { id: "craft.diy.cabinets", name: "Cabinets & Storage", icon: "🗄️", description: "Custom storage, organization units", suggested_quests: &["Measure and plan", "Assemble a cabinet", "Install hardware"] },
        ]},
        CatalogGroup { id: "craft.culinary", name: "Culinary Arts", icon: "🍳", skills: &[
            CatalogSkill { id: "craft.culinary.grilling", name: "Grilling", icon: "🔥", description: "BBQ, smoking, charcoal, gas", suggested_quests: &["Grill a steak", "Try a new marinade", "Smoke ribs"] },
            CatalogSkill { id: "craft.culinary.baking", name: "Baking", icon: "🍞", description: "Bread, pastries, desserts", suggested_quests: &["Bake bread from scratch", "Try a new recipe", "Perfect a crust"] },
            CatalogSkill { id: "craft.culinary.sousvide", name: "Sous-vide", icon: "🥩", description: "Precision cooking, vacuum sealing", suggested_quests: &["Cook a sous-vide steak", "Experiment with a new protein", "Dial in a time/temp"] },
            CatalogSkill { id: "craft.culinary.mealprep", name: "Meal Prep", icon: "🍱", description: "Batch cooking, portioning, planning", suggested_quests: &["Prep lunches for the week", "Try a new meal plan", "Organize the fridge"] },
            CatalogSkill { id: "craft.culinary.fermentation", name: "Fermentation", icon: "🫙", description: "Pickling, sourdough, kombucha", suggested_quests: &["Feed the sourdough", "Start a ferment", "Bottle a batch"] },
            CatalogSkill { id: "craft.culinary.coffee", name: "Coffee", icon: "☕", description: "Brewing, espresso, latte art", suggested_quests: &["Dial in a new bean", "Practice latte art", "Try a brew method"] },
            CatalogSkill { id: "craft.culinary.knife_skills", name: "Knife Skills", icon: "🔪", description: "Chopping, dicing, prep techniques", suggested_quests: &["Practice julienne", "Sharpen knives", "Prep a mise en place"] },
        ]},
        CatalogGroup { id: "craft.garden", name: "Gardening & Nature", icon: "🌱", skills: &[
            CatalogSkill { id: "craft.garden.indoor", name: "Indoor Plants", icon: "🪴", description: "Houseplants, potting, care", suggested_quests: &["Water and check all plants", "Repot a plant", "Propagate a cutting"] },
            CatalogSkill { id: "craft.garden.outdoor", name: "Outdoor Garden", icon: "🌻", description: "Beds, flowers, vegetables", suggested_quests: &["Weed a bed", "Plant a new seedling", "Harvest vegetables"] },
            CatalogSkill { id: "craft.garden.balcony", name: "Balcony & Patio", icon: "🌿", description: "Container gardening, small spaces", suggested_quests: &["Water the balcony pots", "Add a new plant", "Fertilize"] },
            CatalogSkill { id: "craft.garden.composting", name: "Composting", icon: "♻️", description: "Organic recycling, soil health", suggested_quests: &["Turn the compost", "Add kitchen scraps", "Check moisture level"] },
            CatalogSkill { id: "craft.garden.hydroponics", name: "Hydroponics", icon: "💧", description: "Soilless growing, nutrients", suggested_quests: &["Check pH levels", "Top up nutrients", "Harvest greens"] },
        ]},
        CatalogGroup { id: "craft.creative", name: "Creative Arts", icon: "🎨", skills: &[
            CatalogSkill { id: "craft.creative.drawing", name: "Drawing", icon: "✏️", description: "Sketching, illustration, digital art", suggested_quests: &["Sketch for 30 min", "Draw from reference", "Try a new style"] },
            CatalogSkill { id: "craft.creative.photography", name: "Photography", icon: "📷", description: "Composition, editing, technique", suggested_quests: &["Take 20 photos", "Edit in Lightroom", "Learn a technique"] },
            CatalogSkill { id: "craft.creative.music", name: "Music", icon: "🎵", description: "Playing, composing, practice", suggested_quests: &["Practice 30 min", "Learn a new song", "Record a take"] },
            CatalogSkill { id: "craft.creative.writing", name: "Creative Writing", icon: "📝", description: "Fiction, blogging, journaling", suggested_quests: &["Write 500 words", "Edit a draft", "Write a blog post"] },
            CatalogSkill { id: "craft.creative.video", name: "Video & Film", icon: "🎬", description: "Filming, editing, production", suggested_quests: &["Film a clip", "Edit a video", "Plan a storyboard"] },
        ]},
        CatalogGroup { id: "craft.vehicles", name: "Vehicles & Gear", icon: "🚗", skills: &[
            CatalogSkill { id: "craft.vehicles.car", name: "Car Maintenance", icon: "🚗", description: "Oil, tires, cleaning, basic repair", suggested_quests: &["Wash the car", "Check tire pressure", "Change oil"] },
            CatalogSkill { id: "craft.vehicles.bicycle", name: "Bicycle", icon: "🚲", description: "Maintenance, riding, touring", suggested_quests: &["Clean the chain", "Adjust brakes", "Go for a ride"] },
            CatalogSkill { id: "craft.vehicles.electronics", name: "Electronics", icon: "🔌", description: "Circuits, Arduino, Raspberry Pi", suggested_quests: &["Build a circuit", "Flash firmware", "Solder a connection"] },
        ]},
        CatalogGroup { id: "craft.textile", name: "Textile & Craft", icon: "🧶", skills: &[
            CatalogSkill { id: "craft.textile.sewing", name: "Sewing", icon: "🧵", description: "Garments, repairs, alterations", suggested_quests: &["Sew a button", "Hem pants", "Start a project"] },
            CatalogSkill { id: "craft.textile.leather", name: "Leatherwork", icon: "🪡", description: "Wallets, belts, tooling", suggested_quests: &["Cut a pattern", "Stitch a piece", "Apply finish"] },
            CatalogSkill { id: "craft.textile.pottery", name: "Pottery", icon: "🏺", description: "Wheel, hand-building, glazing", suggested_quests: &["Throw a pot", "Trim a piece", "Glaze and fire"] },
        ]},
    ]},

    // ──────────────── VITALITY — Family & Life ────────────────
    CatalogCategory { code: "VITALITY", name: "Family & Life", icon: "💚", groups: &[
        CatalogGroup { id: "vitality.partner", name: "Partnership", icon: "💑", skills: &[
            CatalogSkill { id: "vitality.partner.quality_time", name: "Quality Time", icon: "❤️", description: "Dedicated undistracted time together", suggested_quests: &["30 min phone-free time", "Watch a movie together", "Cook together"] },
            CatalogSkill { id: "vitality.partner.date_nights", name: "Date Nights", icon: "🍷", description: "Planning and going on dates", suggested_quests: &["Plan a date night", "Try a new restaurant", "Surprise outing"] },
            CatalogSkill { id: "vitality.partner.gifts", name: "Thoughtful Gifts", icon: "🎁", description: "Surprises, celebrations, tokens of love", suggested_quests: &["Buy a small surprise", "Write a love note", "Plan a birthday gift"] },
            CatalogSkill { id: "vitality.partner.communication", name: "Communication", icon: "💬", description: "Active listening, resolving conflicts", suggested_quests: &["Have a check-in talk", "Practice active listening", "Discuss goals"] },
            CatalogSkill { id: "vitality.partner.shared_goals", name: "Shared Goals", icon: "🎯", description: "Joint planning, vision, teamwork", suggested_quests: &["Review shared goals", "Plan next month together", "Align on finances"] },
        ]},
        CatalogGroup { id: "vitality.parenting", name: "Parenting", icon: "👶", skills: &[
            CatalogSkill { id: "vitality.parenting.baby_care", name: "Baby Care", icon: "🍼", description: "Feeding, sleep training, development", suggested_quests: &["Track feeding schedule", "Research a milestone", "Set up a routine"] },
            CatalogSkill { id: "vitality.parenting.toddler", name: "Toddler Routines", icon: "🧸", description: "Daily routines, boundaries, play", suggested_quests: &["Morning routine on time", "Teach a new word", "Outdoor playtime"] },
            CatalogSkill { id: "vitality.parenting.activities", name: "Kids Activities", icon: "🎨", description: "Crafts, outings, educational play", suggested_quests: &["Art project together", "Visit a playground", "Read 3 books"] },
            CatalogSkill { id: "vitality.parenting.school", name: "School Support", icon: "📚", description: "Homework help, teacher communication", suggested_quests: &["Help with homework", "Attend a school event", "Pack lunch"] },
            CatalogSkill { id: "vitality.parenting.teen", name: "Teen Mentoring", icon: "🧑\u{200d}🎓", description: "Guiding teenagers, conversations", suggested_quests: &["Have a real conversation", "Set boundaries together", "Share a skill"] },
            CatalogSkill { id: "vitality.parenting.morning", name: "Morning Routines", icon: "🌅", description: "Getting everyone ready, breakfast", suggested_quests: &["Everyone out on time", "Prepare breakfast", "Pack bags night before"] },
        ]},
        CatalogGroup { id: "vitality.social", name: "Social", icon: "🫂", skills: &[
            CatalogSkill { id: "vitality.social.friendships", name: "Friendships", icon: "👥", description: "Maintaining and deepening friendships", suggested_quests: &["Reach out to a friend", "Plan a hangout", "Send a thoughtful message"] },
            CatalogSkill { id: "vitality.social.networking", name: "Professional Networking", icon: "🤝", description: "Building professional relationships", suggested_quests: &["Attend an event", "Connect on LinkedIn", "Have a coffee chat"] },
            CatalogSkill { id: "vitality.social.volunteering", name: "Volunteering", icon: "🤲", description: "Community service and giving back", suggested_quests: &["Volunteer 2 hours", "Donate items", "Organize a community event"] },
            CatalogSkill { id: "vitality.social.community", name: "Community", icon: "🏘️", description: "Neighbors, local events, belonging", suggested_quests: &["Attend a local event", "Help a neighbor", "Join a group"] },
        ]},
        CatalogGroup { id: "vitality.mental", name: "Mental Health", icon: "🧘", skills: &[
            CatalogSkill { id: "vitality.mental.meditation", name: "Meditation", icon: "🧘", description: "Mindfulness, breathing, presence", suggested_quests: &["Meditate 10 min", "Try a guided session", "Practice breathing"] },
            CatalogSkill { id: "vitality.mental.journaling", name: "Journaling", icon: "📓", description: "Reflection, gratitude, processing", suggested_quests: &["Write 1 page", "List 3 gratitudes", "Reflect on the week"] },
            CatalogSkill { id: "vitality.mental.therapy", name: "Therapy & Self-Work", icon: "💭", description: "Professional support, self-awareness", suggested_quests: &["Attend a session", "Do a workbook exercise", "Practice a coping skill"] },
            CatalogSkill { id: "vitality.mental.stress", name: "Stress Management", icon: "🌊", description: "Coping strategies, relaxation", suggested_quests: &["Take a nature walk", "Practice deep breathing", "Do a digital detox"] },
        ]},
        CatalogGroup { id: "vitality.admin", name: "Life Admin", icon: "📋", skills: &[
            CatalogSkill { id: "vitality.admin.finances", name: "Personal Finances", icon: "💰", description: "Bills, tracking, planning", suggested_quests: &["Pay bills", "Review subscriptions", "Update the budget"] },
            CatalogSkill { id: "vitality.admin.legal", name: "Legal & Insurance", icon: "📄", description: "Contracts, policies, paperwork", suggested_quests: &["Review a policy", "File a document", "Update beneficiaries"] },
            CatalogSkill { id: "vitality.admin.organization", name: "Home Organization", icon: "🗂️", description: "Decluttering, systems, storage", suggested_quests: &["Declutter one drawer", "Organize a closet", "Label storage bins"] },
            CatalogSkill { id: "vitality.admin.errands", name: "Errands & Tasks", icon: "✅", description: "Shopping, appointments, admin", suggested_quests: &["Schedule an appointment", "Grocery shop", "Return an item"] },
        ]},
    ]},

    // ──────────────── STR — Strength & Fitness ────────────────
    CatalogCategory { code: "STR", name: "Strength & Fitness", icon: "💪", groups: &[
        CatalogGroup { id: "str.resistance", name: "Resistance Training", icon: "🏋️", skills: &[
            CatalogSkill { id: "str.resistance.upper", name: "Upper Body", icon: "💪", description: "Chest, back, shoulders, arms", suggested_quests: &["Bench press session", "Pull-up set", "Shoulder press"] },
            CatalogSkill { id: "str.resistance.lower", name: "Lower Body", icon: "🦵", description: "Squats, deadlifts, lunges", suggested_quests: &["Squat session", "Deadlift set", "Walking lunges"] },
            CatalogSkill { id: "str.resistance.core", name: "Core", icon: "🎯", description: "Abs, obliques, stability", suggested_quests: &["Plank 3 min total", "Ab circuit", "Anti-rotation drill"] },
            CatalogSkill { id: "str.resistance.calisthenics", name: "Calisthenics", icon: "🤸", description: "Bodyweight skills, progressions", suggested_quests: &["Push-up variations", "Practice a skill move", "Handstand hold"] },
            CatalogSkill { id: "str.resistance.olympic", name: "Olympic Lifts", icon: "🏋️\u{200d}♂️", description: "Clean, snatch, jerk", suggested_quests: &["Practice clean form", "Snatch drill", "Jerk from rack"] },
            CatalogSkill { id: "str.resistance.kettlebell", name: "Kettlebells", icon: "🫎", description: "Swings, Turkish get-ups, flows", suggested_quests: &["100 swings", "Turkish get-up practice", "Kettlebell flow"] },
        ]},
        CatalogGroup { id: "str.cardio", name: "Cardio", icon: "🏃", skills: &[
            CatalogSkill { id: "str.cardio.running", name: "Running", icon: "🏃", description: "Sprints, distance, trails", suggested_quests: &["Run 5K", "Interval sprints", "Trail run"] },
            CatalogSkill { id: "str.cardio.cycling", name: "Cycling", icon: "🚴", description: "Road, indoor, mountain biking", suggested_quests: &["30 min ride", "Hill intervals", "Long endurance ride"] },
            CatalogSkill { id: "str.cardio.swimming", name: "Swimming", icon: "🏊", description: "Laps, technique, open water", suggested_quests: &["Swim 30 min", "Practice a stroke", "Timed 500m"] },
            CatalogSkill { id: "str.cardio.rowing", name: "Rowing", icon: "🚣", description: "Machine or water rowing", suggested_quests: &["2000m row", "Interval row", "Technique focus"] },
            CatalogSkill { id: "str.cardio.jump_rope", name: "Jump Rope", icon: "⏭️", description: "Skipping, double-unders, combos", suggested_quests: &["10 min jump rope", "Practice double-unders", "Learn a combo"] },
            CatalogSkill { id: "str.cardio.hiking", name: "Hiking", icon: "🥾", description: "Trail walking, elevation, nature", suggested_quests: &["Hike 1 hour", "Find a new trail", "Summit a hill"] },
        ]},
        CatalogGroup { id: "str.flexibility", name: "Flexibility & Mobility", icon: "🤸", skills: &[
            CatalogSkill { id: "str.flexibility.yoga", name: "Yoga", icon: "🧘", description: "Flows, poses, balance", suggested_quests: &["30 min yoga session", "Try a new flow", "Hold crow pose"] },
            CatalogSkill { id: "str.flexibility.stretching", name: "Stretching", icon: "🤸", description: "Static, dynamic, PNF", suggested_quests: &["15 min stretch routine", "Work on splits", "Shoulder mobility"] },
            CatalogSkill { id: "str.flexibility.foam_rolling", name: "Foam Rolling", icon: "🔄", description: "Myofascial release, recovery", suggested_quests: &["Full body roll-out", "Focus on quads/IT band", "Pre-workout roll"] },
            CatalogSkill { id: "str.flexibility.pilates", name: "Pilates", icon: "🏋️\u{200d}♀️", description: "Core-focused controlled movement", suggested_quests: &["Pilates session", "Practice the hundred", "Reformer class"] },
            CatalogSkill { id: "str.flexibility.martial_arts", name: "Martial Arts", icon: "🥋", description: "Any martial art discipline", suggested_quests: &["Attend a class", "Practice forms", "Spar a round"] },
        ]},
        CatalogGroup { id: "str.recovery", name: "Recovery", icon: "🧘", skills: &[
            CatalogSkill { id: "str.recovery.sleep", name: "Sleep", icon: "😴", description: "Quality sleep, sleep hygiene", suggested_quests: &["In bed by 10pm", "No screens 1hr before bed", "Track sleep quality"] },
            CatalogSkill { id: "str.recovery.nutrition", name: "Nutrition", icon: "🥗", description: "Fueling training, balanced eating", suggested_quests: &["Hit protein target", "Eat 5 servings of vegetables", "Prep meals"] },
            CatalogSkill { id: "str.recovery.hydration", name: "Hydration", icon: "💧", description: "Water intake, electrolytes", suggested_quests: &["Drink 3L water", "Add electrolytes post-workout", "Track intake"] },
            CatalogSkill { id: "str.recovery.rest_days", name: "Rest Days", icon: "🛋️", description: "Active recovery, deload weeks", suggested_quests: &["Take a full rest day", "Light walk only", "Plan a deload week"] },
        ]},
        CatalogGroup { id: "str.sports", name: "Sports", icon: "⚽", skills: &[
            CatalogSkill { id: "str.sports.basketball", name: "Basketball", icon: "🏀", description: "Shooting, dribbling, games", suggested_quests: &["Shoot hoops 30 min", "Play a pickup game", "Practice dribbling"] },
            CatalogSkill { id: "str.sports.soccer", name: "Soccer", icon: "⚽", description: "Passing, shooting, games", suggested_quests: &["Join a game", "Practice juggling", "Shooting drills"] },
            CatalogSkill { id: "str.sports.tennis", name: "Tennis", icon: "🎾", description: "Serves, rallies, matches", suggested_quests: &["Hit for 1 hour", "Practice serves", "Play a match"] },
            CatalogSkill { id: "str.sports.climbing", name: "Climbing", icon: "🧗", description: "Bouldering, sport climbing", suggested_quests: &["Climb 1 hour", "Project a harder route", "Train grip strength"] },
        ]},
    ]},
];

// ═══════════════════════════════════════════════════════════════════
//  BUNDLES
// ═══════════════════════════════════════════════════════════════════

static BUNDLES: &[QuickStartBundle] = &[
    QuickStartBundle {
        key: "student",
        name: "Student Starter",
        description: "For academic life: studies, languages, health basics",
        icon: "🎓",
        skill_ids: &[
            "int.academic.math", "int.academic.research", "int.academic.writing", "int.academic.exams",
            "int.languages.english", "craft.culinary.mealprep", "vitality.social.friendships",
            "vitality.mental.stress", "vitality.admin.finances", "str.cardio.running",
            "str.recovery.sleep", "str.recovery.nutrition",
        ],
    },
    QuickStartBundle {
        key: "parent",
        name: "New Parent",
        description: "For parents: kids, partner, home, self-care",
        icon: "👶",
        skill_ids: &[
            "vitality.parenting.toddler", "vitality.parenting.morning", "vitality.parenting.activities",
            "vitality.partner.quality_time", "vitality.partner.date_nights", "craft.culinary.mealprep",
            "craft.diy.home_repair", "vitality.admin.organization", "str.recovery.sleep",
            "str.cardio.running", "int.leadership.communication", "vitality.mental.stress",
        ],
    },
    QuickStartBundle {
        key: "fitness",
        name: "Fitness Journey",
        description: "Full fitness stack: lifting, cardio, recovery, nutrition",
        icon: "💪",
        skill_ids: &[
            "str.resistance.upper", "str.resistance.lower", "str.resistance.core",
            "str.cardio.running", "str.cardio.cycling", "str.flexibility.stretching",
            "str.flexibility.yoga", "str.recovery.sleep", "str.recovery.nutrition",
            "str.recovery.hydration", "vitality.mental.meditation", "craft.culinary.mealprep",
        ],
    },
    QuickStartBundle {
        key: "career",
        name: "Career Builder",
        description: "Level up professionally: engineering, leadership, finance",
        icon: "💼",
        skill_ids: &[
            "int.software.backend", "int.software.frontend", "int.software.system_design",
            "int.leadership.team", "int.leadership.communication", "int.leadership.decisions",
            "int.finance.budgeting", "int.finance.investing", "vitality.social.networking",
            "vitality.mental.stress", "str.recovery.sleep", "str.cardio.running",
        ],
    },
    QuickStartBundle {
        key: "balanced",
        name: "Balanced Life",
        description: "A bit of everything: work, home, relationships, health",
        icon: "⚖️",
        skill_ids: &[
            "int.leadership.communication", "int.finance.budgeting", "craft.culinary.mealprep",
            "craft.diy.home_repair", "craft.garden.indoor", "vitality.partner.quality_time",
            "vitality.social.friendships", "vitality.mental.journaling", "vitality.admin.organization",
            "str.resistance.core", "str.cardio.running", "str.recovery.sleep",
        ],
    },
];

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════

pub fn get_catalog() -> &'static [CatalogCategory] {
    CATALOG
}

pub fn get_bundles() -> &'static [QuickStartBundle] {
    BUNDLES
}

#[allow(dead_code)]
pub fn find_catalog_skill(skill_id: &str) -> Option<&'static CatalogSkill> {
    for cat in CATALOG {
        for grp in cat.groups {
            for sk in grp.skills {
                if sk.id == skill_id {
                    return Some(sk);
                }
            }
        }
    }
    None
}

pub fn find_catalog_context(skill_id: &str) -> Option<(&'static CatalogCategory, &'static CatalogGroup, &'static CatalogSkill)> {
    for cat in CATALOG {
        for grp in cat.groups {
            for sk in grp.skills {
                if sk.id == skill_id {
                    return Some((cat, grp, sk));
                }
            }
        }
    }
    None
}

pub fn get_bundle_skill_ids(bundle_key: &str) -> Vec<&'static str> {
    BUNDLES.iter()
        .find(|b| b.key == bundle_key)
        .map(|b| b.skill_ids.to_vec())
        .unwrap_or_default()
}
