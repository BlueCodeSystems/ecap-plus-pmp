import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileEdit,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  type: "completed" | "issue" | "pending" | "updated";
  title: string;
  description: string;
  user: string;
  province: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "completed",
    title: "DQA Assessment Completed",
    description: "Quarterly assessment for Lusaka Urban District",
    user: "Mary Banda",
    province: "Lusaka",
    time: "10 minutes ago",
  },
  {
    id: "2",
    type: "issue",
    title: "Data Discrepancy Found",
    description: "Inconsistent records in Ndola Health Center",
    user: "John Mwale",
    province: "Copperbelt",
    time: "1 hour ago",
  },
  {
    id: "3",
    type: "pending",
    title: "Review Pending",
    description: "Awaiting supervisor approval for Chipata assessment",
    user: "Grace Phiri",
    province: "Eastern",
    time: "2 hours ago",
  },
  {
    id: "4",
    type: "updated",
    title: "Assessment Updated",
    description: "Corrections made to Livingstone facility data",
    user: "Peter Mulenga",
    province: "Southern",
    time: "3 hours ago",
  },
  {
    id: "5",
    type: "completed",
    title: "DQA Assessment Completed",
    description: "Monthly review for Kabwe Central Hospital",
    user: "Susan Tembo",
    province: "Central",
    time: "5 hours ago",
  },
];

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "issue":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "updated":
      return <FileEdit className="h-4 w-4 text-primary" />;
  }
};

const getActivityBadge = (type: Activity["type"]) => {
  switch (type) {
    case "completed":
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Completed</Badge>;
    case "issue":
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Issue</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">Pending</Badge>;
    case "updated":
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Updated</Badge>;
  }
};

const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest DQA assessments and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground text-sm truncate">
                    {activity.title}
                  </p>
                  {getActivityBadge(activity.type)}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {activity.user}
                  </span>
                  <span>{activity.province}</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
