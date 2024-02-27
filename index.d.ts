declare module 'stig-manager-client-modules';

interface ApiCollectionBasic {
    collectionId: string;
    name: string;
}
interface ApiCollectionStig {
    benchmarkId: string;
    revisionStr: string;
    benchmarkDate: string;
    revisionPinned: boolean;
    ruleCount: number;
}
interface ApiAsset {
    assetId?: string;
    name: string;
    fqdn: string;
    description: string;
    ip: string;
    mac: string;
    noncomputing: boolean;
    metadata: Object;
    collection: ApiCollectionBasic;
    labelIds: string[];
    stigs: ApiCollectionStig[] | string[];
}
interface ApiStig {
    benchmarkId: string;
    revisionStr: string;
    version: string;
    release: string;
    benchmarkDate: string;
    status: string;
    statusDate: string;
    ruleCount: string;
    collectionIds: string[];
}

interface ParsedTarget {
    description: string;
    fqdn: string;
    ip: string;
    mac: string;
    metadata: Object; 
    name: string;
    noncomputing: boolean;
}

interface ResultEngine {
    checkContent?: ResultEngineCheckContent;
    overrides?: ResultEngineOverride[]
    product: string;
    time?: string /* date-time */;
    type: ResultEngineType;
    version?: string
}

type ReviewResult = 'pass' | 'fail' | 'notapplicable' | 'notchecked' | 'unknown' | 'error' | 'notselected' | 'informational' | 'fixed';
type ReviewStatus = 'saved' | 'submitted' | 'accepted' | 'rejected' | null;
type ResultEngineType = 'scap' | 'script' | 'other';
interface ResultEngineCheckContent {
    component: string;
    location: string;
}
interface ResultEngineOverride {
    authority: string;
    newResult: ReviewResult;
    oldResult: ReviewResult;
    remark?: string;
    time?: string /* date-time */;
}
interface ParsedReview {
    comment: string;
    detail: string;
    result: ReviewResult;
    resultEngine: ResultEngine | null;
    ruleId: string;
    status: ReviewStatus;
}

interface ParsedChecklistStats {
    error: number;
    fail: number;
    fixed: number;
    informational: number;
    notapplicable: number;
    notchecked: number;
    noselected: number;
    pass: number;
    unknown: number;
}

interface ParsedChecklist {
    benchmarkId: string;
    reviews: ParsedReview[];
    revisionStr: string;
    stats: ParsedChecklistStats;
    sourceRef: any;
}

interface ParseResult {
    target: ParsedTarget;
    errors?: string[]; // only used in the ckl parser
    checklists: ParsedChecklist[];
    sourceRef: any;
}

interface TaskObjectOptions {
    createObjects: boolean;
    collectionId: string;
    strictRevisionCheck: boolean;
    [key: string]: any;
}

interface TaskObjectParseResult extends ParseResult {
    file: string;
}

interface TaskObjectParams {
    apiAssets: ApiAsset[],
    apiStigs: ApiStig[],
    parsedResults: TaskObjectParseResult[],
    options: TaskObjectOptions
}

interface TaskAssetChecklist extends ParsedChecklist {
    newAssignment: boolean;
    ignored?: boolean;
}

interface TaskAssetValue {
    assetProps: ApiAsset;
    checklists: Map<string, TaskAssetChecklist[]>;
    checklistsIgnored: TaskAssetChecklist[];
    hasNewAssignment: boolean;
    knownAsset: boolean;
    newAssignments: string[];
    sourceRefs: any[];
}

interface TaskObjectError { 
  message: string;
  target: ParsedTarget;
  sourceRef: any;
}

declare class TaskObject {
    constructor (options: TaskObjectParams);
    apiAssets: ApiAsset[];
    apiStigs: ApiStig[];
    #assetNameMap: Map<string, ApiAsset>;
    #benchmarkIdMap: Map<string, string[]>;
    #cklHostnameMap: Map<string, ApiAsset[]>;
    errors: TaskObjectError[];
    parsedResults: TaskObjectParseResult[];
    sourceRefs: any[];
    taskAssets: Map<string, TaskAssetValue>;
}

type AutoStatus = 'null' | 'saved' | 'submitted' | 'accepted';
type Unreviewed = 'commented' | 'never' | 'always';
type UnreviewedCommented = 'informational' | 'notchecked';
type EmptyCommentDetailType = 'replace' | 'ignore' | 'import';
type RequiredType = 'always' | 'findings' | 'optional';
type EnabledType = 'always' | 'findings';

interface FieldOptions {
  enabled: EnabledType;
  required: RequiredType;
};

interface FieldSettings {
  detail: FieldOptions;
  comment: FieldOptions;
}

interface ImportOptions {
  autoStatus: AutoStatus;
  unreviewed: Unreviewed;
  unreviewedCommented: UnreviewedCommented;
  emptyDetail: EmptyCommentDetailType;
  emptyComment: EmptyCommentDetailType;
  allowCustom: boolean;
}

interface ParserParams {
  data: string;
  fieldSettings: FieldSettings;
  allowAccept: boolean;
  importOptions: ImportOptions;
  sourceRef: any;
}

interface ImportOptions {
  autoStatus: AutoStatus;
  unreviewed: Unreviewed;
  unreviewedCommented: UnreviewedCommented;
  emptyDetail: EmptyCommentDetailType;
  emptyComment: EmptyCommentDetailType;
  allowCustom: boolean;
}

interface ScapBenchmarkMap {
  [key: string]: string;
}

interface ParserXccdfParams extends ParserParams{
  scapBenchmarkMap: ScapBenchmarkMap;
}
