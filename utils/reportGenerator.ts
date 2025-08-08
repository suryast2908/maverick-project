import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserProfile } from '../types';

export interface AdminReportData {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    siteHealth: string;
    topUsersByXp: UserProfile[];
    topContributors: {
        id: string;
        name: string;
        avatar: string;
        posts: number;
        score: number;
    }[];
    skillDistribution: { name: string; value: number; color: string }[];
}

export const generateAdminUsageReportPdf = (data: AdminReportData) => {
    const doc = new jsPDF();
    let y = 20;

    const addTitle = (title: string) => {
        doc.setFontSize(22);
        doc.text(title, 105, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10);
        doc.text(`Report Generated on: ${new Date().toLocaleString()}`, 105, y, { align: 'center' });
        y += 15;
    };

    const addSection = (title: string) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text(title, 14, y);
        y += 8;
    };
    
    const addText = (text: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 14, y);
        y += (splitText.length * 5) + 5;
    };

    addTitle("Mavericks Platform Usage Report");

    // --- Overview ---
    addSection("Platform Overview");
    addText(`• Total Users: ${data.totalUsers}`);
    addText(`• Active Users (in last 24h): ${data.activeUsers}`);
    addText(`• Inactive Users: ${data.inactiveUsers}`);
    addText(`• Simulated Site Health: ${data.siteHealth}`);
    y += 5;

    // --- Top Users ---
    addSection("Top Users by XP");
    autoTable(doc, {
        startY: y,
        head: [['Rank', 'Name', 'XP', 'Level']],
        body: data.topUsersByXp.map((user, index) => [
            index + 1,
            user.name,
            user.xp || 0,
            user.level || 1
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });
    y = (doc as any).lastAutoTable?.finalY + 15 || y;

    // --- Top Contributors ---
    addSection("Top Community Contributors");
    addText("Contributors are ranked based on a score calculated from their posts and votes in the discussion forum.");
    autoTable(doc, {
        startY: y,
        head: [['Rank', 'Name', 'Posts', 'Contribution Score']],
        body: data.topContributors.map((c, index) => [
            index + 1,
            c.name,
            c.posts,
            c.score
        ]),
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
    });
    y = (doc as any).lastAutoTable?.finalY + 15 || y;
    
    // --- Skill Distribution ---
    addSection("Skill Distribution");
    addText("This table shows the most common skills listed by users across the platform.");
    autoTable(doc, {
        startY: y,
        head: [['Skill', 'Number of Users']],
        body: data.skillDistribution.sort((a, b) => b.value - a.value).map(s => [s.name, s.value]),
        theme: 'grid',
    });
    y = (doc as any).lastAutoTable?.finalY + 15 || y;

    doc.save(`Mavericks_Usage_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};


export const generateUserProfilePdf = (user: UserProfile) => {
    const doc = new jsPDF();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.text(`User Report: ${user.name}`, 14, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(user.email, 14, y);
    y += 15;

    // Profile Summary
    doc.setFontSize(16);
    doc.text('Profile Summary', 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Headline: ${user.headline || 'N/A'}`, 14, y);
    y += 7;
    doc.text(`Current Role: ${user.currentRole || 'N/A'}`, 14, y);
    y += 7;
    doc.text(`Dream Role: ${user.dreamRole || 'N/A'}`, 14, y);
    y += 7;
    doc.text(`Location: ${user.location || 'N/A'}`, 14, y);
    y += 7;
    doc.text(`GitHub: ${user.githubUsername || 'N/A'}`, 14, y);
    y += 15;

    // Key Stats
    autoTable(doc, {
        startY: y,
        head: [['Key Statistics', 'Value']],
        body: [
            ['Problems Solved', user.questionsSolved || 0],
            ['Last Assessment Score', `${user.assessmentScore}%`],
            ['Learning Paths Created', user.learningPaths?.length || 0],
            ['Hackathons Participated', user.hackathonResults?.length || 0],
        ],
        theme: 'striped',
    });
    y = (doc as any).lastAutoTable?.finalY + 15 || y;

    // Skills
    if (user.skills && user.skills.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Skill', 'Proficiency Level']],
            body: user.skills.map(skill => [skill.name, skill.level]),
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });
        y = (doc as any).lastAutoTable?.finalY + 15 || y;
    } else {
        doc.setFontSize(11);
        doc.text('No skills listed.', 14, y);
        y += 15;
    }

    // Learning Paths
    if (user.learningPaths && user.learningPaths.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.text('Learning Paths', 14, y);
        y += 10;
        user.learningPaths.forEach(path => {
            doc.setFontSize(12);
            doc.text(path.title, 14, y);
            y += 6;
            doc.setFontSize(10);
            doc.text(`Summary: ${path.summary}`, 16, y, { maxWidth: 170 });
            y += 12;
            autoTable(doc, {
                startY: y,
                head: [['Module', 'Status']],
                body: path.modules.map(m => [m.title, m.completed ? 'Completed' : 'Pending']),
                theme: 'striped',
                margin: { left: 16 }
            });
            y = (doc as any).lastAutoTable?.finalY + 10 || y;
        });
    }

    // Activity History
    if (user.activity && user.activity.length > 0) {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(16);
        doc.text('Recent Activity', 14, y);
        y += 10;
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Type', 'Language', 'Score']],
            body: user.activity.slice(0, 15).map(act => [
                new Date(act.date).toLocaleDateString(),
                act.type,
                act.language,
                act.score !== undefined ? `${act.score}%` : 'N/A'
            ]),
            theme: 'grid',
        });
        y = (doc as any).lastAutoTable?.finalY + 15 || y;
    }
    
    doc.save(`${user.name.replace(/\s/g, '_')}_Report.pdf`);
};
