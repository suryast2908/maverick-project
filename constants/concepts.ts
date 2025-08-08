import { ConceptListItem } from '../types';

export const CONCEPT_LIST: ConceptListItem[] = [
    // Easy
    { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topics: ['Array', 'Hash Table'] },
    { id: 'reverse-string', title: 'Reverse String', difficulty: 'Easy', topics: ['String', 'Two Pointers'] },
    { id: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Easy', topics: ['String', 'Stack'] },
    { id: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', difficulty: 'Easy', topics: ['Linked List', 'Recursion'] },
    { id: 'fizz-buzz', title: 'Fizz Buzz', difficulty: 'Easy', topics: ['Math', 'String'] },
    { id: 'maximum-subarray', title: 'Maximum Subarray', difficulty: 'Easy', topics: ['Array', 'Divide and Conquer', 'Dynamic Programming'] },
    { id: 'binary-search', title: 'Binary Search', difficulty: 'Easy', topics: ['Array', 'Binary Search'] },

    // Medium
    { id: 'add-two-numbers', title: 'Add Two Numbers', difficulty: 'Medium', topics: ['Linked List', 'Math'] },
    { id: 'longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topics: ['Hash Table', 'String', 'Sliding Window'] },
    { id: 'group-anagrams', title: 'Group Anagrams', difficulty: 'Medium', topics: ['Array', 'Hash Table', 'String'] },
    { id: '3sum', title: '3Sum', difficulty: 'Medium', topics: ['Array', 'Two Pointers', 'Sorting'] },
    { id: 'top-k-frequent-elements', title: 'Top K Frequent Elements', difficulty: 'Medium', topics: ['Array', 'Hash Table', 'Heap'] },
    { id: 'validate-binary-search-tree', title: 'Validate Binary Search Tree', difficulty: 'Medium', topics: ['Tree', 'Depth-First Search', 'Binary Search Tree'] },
    { id: 'coin-change', title: 'Coin Change', difficulty: 'Medium', topics: ['Array', 'Dynamic Programming'] },
    { id: 'product-of-array-except-self', title: 'Product of Array Except Self', difficulty: 'Medium', topics: ['Array', 'Prefix Sum'] },

    // Hard
    { id: 'median-of-two-sorted-arrays', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topics: ['Array', 'Binary Search', 'Divide and Conquer'] },
    { id: 'trapping-rain-water', title: 'Trapping Rain Water', difficulty: 'Hard', topics: ['Array', 'Two Pointers', 'Stack', 'Dynamic Programming'] },
    { id: 'regular-expression-matching', title: 'Regular Expression Matching', difficulty: 'Hard', topics: ['String', 'Dynamic Programming', 'Recursion'] },
    { id: 'merge-k-sorted-lists', title: 'Merge k Sorted Lists', difficulty: 'Hard', topics: ['Linked List', 'Heap', 'Divide and Conquer'] },
    { id: 'largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', difficulty: 'Hard', topics: ['Array', 'Stack'] },
    { id: 'word-ladder', title: 'Word Ladder', difficulty: 'Hard', topics: ['Hash Table', 'String', 'Breadth-First Search'] },
];

export const ALL_TOPICS = [...new Set(CONCEPT_LIST.flatMap(c => c.topics))].sort();
