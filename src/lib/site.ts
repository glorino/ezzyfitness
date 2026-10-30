export const SITE = {
  name: "Ezzy Fitness",
  tagline: "Train. Transform. Triumph.",
  phone: "+2348000000000",
  phoneHref: "tel:+2348000000000",
  whatsapp: "https://wa.me/2348000000000",
  email: "hello@ezzyfitness.ng",
  address: {
    line1: "Ezra Mall",
    line2: "At Ward 3/A, Ugbor Village Area",
    line3: "Benin City, Oredo LGA, Edo State",
    full: "Ezra Mall, At Ward 3/A, Ugbor Village Area, Benin City, Oredo Local Government Area, Edo State",
  },
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Ezra+Mall+Ugbor+Village+Area+Benin+City+Edo+State",
  hours: [
    { label: "Monday – Friday", value: "5:30am – 10:00pm" },
    { label: "Saturday", value: "7:00am – 9:00pm" },
    { label: "Sunday", value: "2:00pm – 8:00pm" },
  ],
  socials: [
    { label: "Instagram", href: "https://instagram.com/ezzyfitness" },
    { label: "Facebook", href: "https://facebook.com/ezzyfitness" },
    { label: "X", href: "https://x.com/ezzyfitness" },
  ],
  nav: [
    { label: "Home", href: "/#top" },
    { label: "Programs", href: "/#programs" },
    { label: "Schedule", href: "/#schedule" },
    { label: "Trainers", href: "/trainers" },
    { label: "Membership", href: "/membership" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
