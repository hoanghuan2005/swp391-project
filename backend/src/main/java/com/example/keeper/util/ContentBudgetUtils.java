package com.example.keeper.util;

import java.util.ArrayList;
import java.util.List;

public class ContentBudgetUtils {

    /**
     * Distributes a total character limit (e.g. 10000) dynamically among multiple document contents.
     * Documents that are shorter than their base share will not be truncated, and their unused budget
     * will be distributed to documents that exceed their share.
     *
     * @param contents List of document content strings.
     * @param maxTotal Total maximum characters allowed for the combined string.
     * @return List of potentially truncated document content strings matching the total budget limit.
     */
    public static List<String> distributeBudget(List<String> contents, int maxTotal) {
        int n = contents.size();
        if (n == 0) return contents;

        // Step 1: Check if total length is within limit
        int totalLen = 0;
        for (String c : contents) {
            if (c != null) {
                totalLen += c.length();
            }
        }
        if (totalLen <= maxTotal) {
            return contents;
        }

        // Step 2: Initialize allocated lengths
        int[] allocated = new int[n];
        boolean[] finalized = new boolean[n];
        int remainingBudget = maxTotal;
        int remainingDocs = n;

        // Keep distributing until budget is fully allocated
        boolean progress = true;
        while (remainingBudget > 0 && remainingDocs > 0 && progress) {
            progress = false;
            int equalShare = remainingBudget / remainingDocs;
            if (equalShare == 0) {
                // If equalShare is 0, give 1 char to each remaining doc until budget is 0
                for (int i = 0; i < n && remainingBudget > 0; i++) {
                    if (!finalized[i]) {
                        allocated[i]++;
                        remainingBudget--;
                    }
                }
                break;
            }

            for (int i = 0; i < n; i++) {
                if (!finalized[i]) {
                    String content = contents.get(i);
                    int originalLen = content != null ? content.length() : 0;
                    if (originalLen <= equalShare) {
                        // This document is fully satisfied
                        allocated[i] = originalLen;
                        remainingBudget -= originalLen;
                        finalized[i] = true;
                        remainingDocs--;
                        progress = true;
                    }
                }
            }
        }

        // Any document not finalized gets the final equal share of the remaining budget
        if (remainingBudget > 0 && remainingDocs > 0) {
            int equalShare = remainingBudget / remainingDocs;
            int remainder = remainingBudget % remainingDocs;
            for (int i = 0; i < n; i++) {
                if (!finalized[i]) {
                    allocated[i] = equalShare + (remainder > 0 ? 1 : 0);
                    if (remainder > 0) remainder--;
                }
            }
        }

        // Step 3: Perform actual truncation based on allocated lengths
        List<String> result = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String content = contents.get(i);
            if (content == null) {
                result.add("");
                continue;
            }
            if (content.length() > allocated[i]) {
                result.add(content.substring(0, allocated[i]));
            } else {
                result.add(content);
            }
        }
        return result;
    }
}
