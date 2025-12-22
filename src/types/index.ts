import z from 'zod'

export const JobSchema = z.object({
    userId: z.string()
})

export interface JobData {
    jobData: z.infer<typeof JobSchema>
}
