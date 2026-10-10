export type Subject = {
  code: string;
  name: string;
  price: number;
  pdfLink?: string;
  demoLink?: string;
  handwrittenDemoLink?: string;
};

export type Year = {
  name: string;
  subjects: Subject[];
};

export type Course = {
  id: string;
  name: string;
  fullName: string;
  years: Year[];
};

export type Level = {
  id: string;
  name: string;
  courses: Course[];
};

export const ignouData: Level[] = [
  {
    id: 'bachelors',
    name: 'Bachelors',
    courses: [
      {
        id: 'bahdh',
        name: 'BAHDH',
        fullName: 'BA (Honours) Hindi',
        years: [
          {
            name: '1st Year',
            subjects: [
              { code: 'BHDC 101', name: 'हिंदी साहित्य का इतिहास', price: 20 },
              { code: 'BHDC 102', name: 'हिंदी साहित्य का इतिहास (आधुनिक काल)', price: 20 },
              { code: 'BHDC 103', name: 'आदिकालीन एवं मध्यकालीन हिंदी कविता', price: 20 },
              { code: 'BHDC 104', name: 'आधुनिक हिंदी कविता', price: 20 },
              { code: 'BEVAE 181', name: 'पर्यावरण अध्ययन', price: 20 },
            ]
          },
          {
            name: '2nd Year',
            subjects: [
              { code: 'BHDC 105', name: 'छायावादोत्तर हिंदी कविता', price: 20 },
              { code: 'BHDC 106', name: 'भारतीय काव्यशास्त्र', price: 20 },
              { code: 'BHDC 107', name: 'पाश्चात्य काव्यशास्त्र', price: 20 },
              { code: 'BHDC 108', name: 'भाषा विज्ञान और हिंदी भाषा', price: 20 },
              { code: 'BHDC 109', name: 'हिंदी उपन्यास', price: 20 },
              { code: 'BHDC 110', name: 'हिंदी कहानी', price: 20 },
            ]
          },
          {
            name: '3rd Year',
            subjects: [
              { code: 'BHDC 111', name: 'हिंदी नाटक एवं एकांकी', price: 20 },
              { code: 'BHDC 112', name: 'हिंदी निबंध और अन्य गद्य विधाएँ', price: 20 },
              { code: 'BHDC 113', name: 'हिंदी की साहित्यिक पत्रकारिता', price: 20 },
              { code: 'BHDC 114', name: 'प्रयोजनमूलक हिंदी', price: 20 },
            ]
          }
        ]
      },
      {
        id: 'bag',
        name: 'BAG',
        fullName: 'Bachelor of Arts (General)',
        years: [
          {
            name: '1st Year',
            subjects: [
              { code: 'BEVAE 181', name: 'Environmental Studies', price: 20 },
              { code: 'BHDLA 135', name: 'Hindi Bhasha: Vividh Prayog', price: 20 },
              { code: 'BEGLA 135', name: 'English In Daily Life', price: 20 },
              { code: 'BHDC 131', name: 'Hindi Sahitya Ka Itihas', price: 20 },
              { code: 'BHDC 132', name: 'Madhyakalin Hindi Kavita', price: 20 },
              { code: 'BPSC 131', name: 'Introduction to Political Theory', price: 20 },
              { code: 'BPSC 132', name: 'Indian Government and Politics', price: 20 },
            ]
          },
          {
            name: '2nd Year',
            subjects: [
              { code: 'BHDLA 136', name: 'Hindi Bhasha: Lekhan Kaushal', price: 20 },
              { code: 'BEGLA 136', name: 'English at the Workplace', price: 20 },
              { code: 'BHDC 133', name: 'Adhunik Hindi Kavita', price: 20 },
              { code: 'BHDC 134', name: 'Hindi Gadya Sahitya', price: 20 },
              { code: 'BPSC 133', name: 'Comparative Government and Politics', price: 20 },
              { code: 'BPSC 134', name: 'Introduction to International Relations', price: 20 },
            ]
          },
          {
            name: '3rd Year',
            subjects: [
              { code: 'BHDSE 141', name: 'ASMita Mulak Vimarsh Aur Hindi Sahitya', price: 20 },
              { code: 'BHDSE 142', name: 'Rashtriya Kavyadhara', price: 20 },
              { code: 'BHDSE 143', name: 'Premchand', price: 20 },
            ]
          }
        ]
      },
      {
        id: 'bca',
        name: 'BCA',
        fullName: 'Bachelor of Computer Applications',
        years: [
          {
            name: '1st Semester',
            subjects: [
              { code: 'BCS-011', name: 'Computer Basics and PC Software', price: 20 },
              { code: 'BCS-012', name: 'Mathematics', price: 20 },
              { code: 'BCSL-013', name: 'Computer Basics and PC Software Lab', price: 20 },
            ]
          },
          {
            name: '2nd Semester',
            subjects: [
              { code: 'MCS-011', name: 'Problem Solving and Programming', price: 20 },
              { code: 'MCS-012', name: 'Computer Organization and Assembly Language Programming', price: 20 },
              { code: 'MCS-015', name: 'Communication Skills', price: 20 },
              { code: 'MCS-013', name: 'Discrete Mathematics', price: 20 },
              { code: 'BCSL-021', name: 'C Language Programming Lab', price: 20 },
              { code: 'BCSL-022', name: 'Assembly Language Programming Lab', price: 20 },
            ]
          }
        ]
      },
      {
        id: 'bcomg',
        name: 'BCOMG',
        fullName: 'Bachelor of Commerce',
        years: [
          {
             name: '1st Year',
             subjects: [
               { code: 'BCOC 131', name: 'Financial Accounting', price: 20 },
               { code: 'BCOC 132', name: 'Business Organization and Management', price: 20 },
               { code: 'BCOC 133', name: 'Business Law', price: 20 },
               { code: 'BCOC 134', name: 'Business Mathematics and Statistics', price: 20 },
             ]
          }
        ]
      }
    ]
  },
  {
    id: 'masters',
    name: 'Masters',
    courses: [
      {
        id: 'mhd',
        name: 'MHD',
        fullName: 'MA Hindi',
        years: [
          {
            name: '1st Year',
            subjects: [
              { code: 'MHD 02', name: 'आधुनिक हिंदी काव्य', price: 20 },
              { code: 'MHD 03', name: 'उपन्यास एवं कहानी', price: 20 },
              { code: 'MHD 04', name: 'नाटक और अन्य गद्य विधाएँ', price: 20 },
              { code: 'MHD 06', name: 'हिंदी भाषा और साहित्य का इतिहास', price: 20 },
            ]
          },
          {
            name: '2nd Year',
            subjects: [
              { code: 'MHD 01', name: 'हिंदी काव्य - १ (आदि काव्य, भक्ति एवं रीति काव्य)', price: 20 },
              { code: 'MHD 05', name: 'साहित्य सिद्धांत और समालोचना', price: 20 },
              { code: 'MHD 07', name: 'भाषा विज्ञान और हिंदी भाषा', price: 20 },
              { code: 'MHD 13', name: 'उपन्यास: स्वरूप और विकास', price: 20 },
              { code: 'MHD 14', name: 'हिंदी उपन्यास-१ (प्रेमचंद का विशेष अध्ययन)', price: 20 },
              { code: 'MHD 15', name: 'हिंदी उपन्यास-२', price: 20 },
              { code: 'MHD 16', name: 'भारतीय उपन्यास', price: 20 },
            ]
          }
        ]
      },
      {
        id: 'mps',
        name: 'MPS',
        fullName: 'MA Political Science',
        years: [
           {
             name: '1st Year',
             subjects: [
                { code: 'MPS 001', name: 'Political Theory', price: 20 },
                { code: 'MPS 002', name: 'International Relations: Theory and Problems', price: 20 },
                { code: 'MPS 003', name: 'India: Democracy and Development', price: 20 },
                { code: 'MPS 004', name: 'Comparative Politics: Issues and Trends', price: 20 },
             ]
           },
           {
             name: '2nd Year',
             subjects: [
                { code: 'MPSE 001', name: 'India and the World', price: 20 },
                { code: 'MPSE 002', name: 'State and Society in Latin America', price: 20 },
                { code: 'MPSE 003', name: 'Western Political Thought', price: 20 },
                { code: 'MPSE 004', name: 'Social and Political Thought in Modern India', price: 20 },
                { code: 'MPSE 005', name: 'State and Society in Africa', price: 20 },
                { code: 'MPSE 006', name: 'Peace and Conflict Studies', price: 20 },
             ]
           }
        ]
      },
      {
        id: 'mcom',
        name: 'MCOM',
        fullName: 'Master of Commerce',
        years: [
          {
            name: '1st Year',
            subjects: [
              { code: 'IBO 01', name: 'International Business Environment', price: 20 },
              { code: 'IBO 02', name: 'International Marketing Management', price: 20 },
              { code: 'IBO 03', name: 'India\'s Foreign Trade', price: 20 },
              { code: 'IBO 04', name: 'Export Import Procedures and Documentation', price: 20 },
              { code: 'IBO 05', name: 'International Marketing Logistics', price: 20 },
              { code: 'IBO 06', name: 'International Business Finance', price: 20 },
            ]
          }
        ]
      }
    ]
  }
];

export const ignouProjectData: Level[] = [
  {
    id: 'bachelors-proj',
    name: 'Bachelors Projects',
    courses: [
      {
        id: 'bca-proj',
        name: 'BCA Projects',
        fullName: 'Bachelor of Computer Applications Projects',
        years: [
          {
            name: 'Final Year',
            subjects: [
              { code: 'BCSP-064', name: 'BCA Project', price: 500 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'masters-proj',
    name: 'Masters Projects',
    courses: []
  }
];
