
// This is a dummy service file. The functions are placeholders and do not
// interact with any real LeetCode API.

export const getLeetCodeUserProfile = async (username: string) => {
    console.log(`Fetching dummy profile for LeetCode user: ${username}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!username) {
        return null;
    }
    
    return {
        username,
        ranking: Math.floor(Math.random() * 100000),
        totalSolved: Math.floor(Math.random() * 500),
        easySolved: Math.floor(Math.random() * 200),
        mediumSolved: Math.floor(Math.random() * 200),
        hardSolved: Math.floor(Math.random() * 100),
    };
};


export const getDummyCompanyQuestions = async (company: string, count: number) => {
    console.log(`Fetching ${count} dummy questions for company: ${company}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const difficulties = ['Easy', 'Medium', 'Hard'];
    const topics = ['Arrays', 'Strings', 'Linked List', 'Trees', 'Dynamic Programming', 'Graphs'];

    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            title: `Dummy Question ${i + 1} for ${company}`,
            difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
            topics: [topics[Math.floor(Math.random() * topics.length)]],
            url: '#'
        });
    }
    return questions;
};
