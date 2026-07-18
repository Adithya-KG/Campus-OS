'use client';

import { useWidgetSDK, useWidgetState } from '@nitrostack/widgets';

interface DocumentRecord {
    id: string;
    type: 'syllabus' | 'assignment' | 'study_material';
    filename: string;
    status: string;
    uploadedAt: string;
}

interface DocumentListOutput {
    studentId: string;
    documents: DocumentRecord[];
}

export default function DocumentListWidget() {
    const sdk = useWidgetSDK();
    const isReady = sdk.isReady;
    const data = sdk.getToolOutput<DocumentListOutput>();

    if (!isReady) {
        return (
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 animate-pulse">
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || !data.documents || data.documents.length === 0) {
        return (
            <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 text-center">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">No Documents</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    You haven't uploaded any documents yet.
                </p>
            </div>
        );
    }

    const formatType = (type: string) => {
        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <span className="text-blue-500">📄</span> Study Materials & Documents
            </h3>
            
            <div className="space-y-3">
                {data.documents.map(doc => (
                    <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <div className="flex flex-col">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                                {doc.filename}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                <span className="px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                    {formatType(doc.type)}
                                </span>
                                <span>•</span>
                                <span>{formatDate(doc.uploadedAt)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                doc.status === 'processed' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                                {doc.status === 'processed' ? 'Processed' : 'Pending'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
